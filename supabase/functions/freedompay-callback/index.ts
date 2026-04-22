import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "npm:md5@2.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function verifySignature(scriptName: string, params: Record<string, string>, secretKey: string): boolean {
  const receivedSig = params.pg_sig;
  const paramsWithoutSig = { ...params };
  delete paramsWithoutSig.pg_sig;

  const sorted = Object.keys(paramsWithoutSig).sort();
  const values = sorted.map(k => paramsWithoutSig[k]);
  const sigString = [scriptName, ...values, secretKey].join(";");
  return md5(sigString) === receivedSig;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SECRET_KEY = Deno.env.get("FREEDOMPAY_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!SECRET_KEY) throw new Error("FREEDOMPAY_SECRET_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse form data from Freedom Pay callback
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = String(value);
    }

    console.log("Freedom Pay callback params:", JSON.stringify(params));

    // Verify signature — Freedom Pay uses the LAST path segment of the result_url
    // Our callback URL ends with "freedompay-callback", so that's the script name.
    // Try multiple variants for compatibility (Freedom Pay sometimes uses different conventions).
    const sigCandidates = ["freedompay-callback", "result_url", "result_notify"];
    let isValid = false;
    let usedScript = "";
    for (const scriptName of sigCandidates) {
      if (verifySignature(scriptName, params, SECRET_KEY)) {
        isValid = true;
        usedScript = scriptName;
        break;
      }
    }

    if (!isValid) {
      console.error("Invalid signature in callback. Tried:", sigCandidates.join(", "));
      console.error("Received params:", JSON.stringify(params));
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><response><pg_status>error</pg_status><pg_description>Invalid signature</pg_description></response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }
    console.log("Signature verified using script name:", usedScript);

    const orderId = params.pg_order_id;
    const pgResult = params.pg_result; // 1 = success, 0 = failure
    const pgPaymentId = params.pg_payment_id;

    // Detect refund callback — Freedom Pay sends pg_refund_* fields when notifying
    // about refund status (after revoke.php is called or refund processed manually).
    const isRefundCallback =
      params.pg_refund_id != null ||
      params.pg_refund_payment_id != null ||
      params.pg_refund_status != null ||
      params.pg_can_reject === "1";

    // Get the payment order
    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId);
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><response><pg_status>error</pg_status><pg_description>Order not found</pg_description></response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    // ============ REFUND CALLBACK ============
    if (isRefundCallback) {
      // Map Freedom Pay refund status to our enum
      // pg_refund_status: 'success' | 'partial' | 'declined' | 'processing' | 'initiated'
      const rawStatus = (params.pg_refund_status || "").toLowerCase();
      let refundStatus: "initiated" | "processing" | "success" | "failed" = "processing";
      if (rawStatus === "success" || rawStatus === "partial" || pgResult === "1") {
        refundStatus = "success";
      } else if (rawStatus === "declined" || rawStatus === "failed" || pgResult === "0") {
        refundStatus = "failed";
      } else if (rawStatus === "initiated") {
        refundStatus = "initiated";
      } else if (rawStatus === "processing") {
        refundStatus = "processing";
      }

      const refundAmount = params.pg_refund_amount
        ? Math.round(Number(params.pg_refund_amount))
        : (params.pg_amount ? Math.round(Number(params.pg_amount)) : order.amount);

      const refundedAt = refundStatus === "success"
        ? (params.pg_refund_date || params.pg_payment_date || new Date().toISOString())
        : null;

      await supabase
        .from("payment_orders")
        .update({
          refund_status: refundStatus,
          refund_id: params.pg_refund_id ?? params.pg_refund_payment_id ?? order.refund_id,
          refund_amount: refundAmount,
          refunded_at: refundedAt,
          refund_reason: params.pg_refund_description ?? params.pg_description ?? order.refund_reason,
          refund_failure_description: refundStatus === "failed"
            ? (params.pg_failure_description ?? params.pg_refund_description ?? null)
            : null,
        })
        .eq("order_id", orderId);

      // If refund succeeded — deactivate user subscription tied to this order
      if (refundStatus === "success") {
        await supabase
          .from("user_subscriptions")
          .update({ is_active: false, expires_at: new Date().toISOString() })
          .eq("order_id", orderId)
          .eq("is_active", true);
      }

      // Journal entry
      await supabase.from("activity_log").insert({
        user_id: order.user_id,
        type: "payment_refund",
        payload_json: {
          event_code: `REFUND_${refundStatus.toUpperCase()}`,
          order_id: orderId,
          refund_id: params.pg_refund_id ?? params.pg_refund_payment_id ?? null,
          refund_amount: refundAmount,
          refund_status: refundStatus,
          refunded_at: refundedAt,
          provider: "freedom_pay",
          occurred_at: new Date().toISOString(),
        },
      });

      console.log(`Refund callback processed: order=${orderId} status=${refundStatus}`);

      // Standard OK reply (built below after the success/failure branches)
      const responseSalt = crypto.randomUUID();
      const responseParams: Record<string, string> = {
        pg_status: "ok",
        pg_description: "Refund processed",
        pg_salt: responseSalt,
      };
      const sorted = Object.keys(responseParams).sort();
      const values = sorted.map(k => responseParams[k]);
      const sigString = [usedScript, ...values, SECRET_KEY].join(";");
      const responseSig = md5(sigString);
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><response><pg_status>ok</pg_status><pg_description>Refund processed</pg_description><pg_salt>${responseSalt}</pg_salt><pg_sig>${responseSig}</pg_sig></response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    if (pgResult === "1") {
      // Payment successful - activate subscription with prorate data
      const { data: plan } = await supabase
        .from("plans")
        .select("*")
        .eq("id", order.plan_id)
        .single();

      if (plan) {
        // Deactivate current subscriptions
        await supabase
          .from("user_subscriptions")
          .update({ is_active: false })
          .eq("user_id", order.user_id)
          .eq("is_active", true);

        // Use prorated expires_at computed at create-payment time.
        // Fallback to plan.duration_days if not present (legacy orders).
        const expiresAt = order.computed_expires_at
          ? new Date(order.computed_expires_at)
          : (() => {
              const d = new Date();
              d.setDate(d.getDate() + plan.duration_days);
              return d;
            })();

        await supabase.from("user_subscriptions").insert({
          user_id: order.user_id,
          plan_id: order.plan_id,
          expires_at: expiresAt.toISOString(),
          note: `Freedom Pay #${pgPaymentId}`,
          amount_paid: order.amount,
          bonus_days: order.bonus_days || 0,
          previous_plan_name: order.previous_plan_name,
          remaining_days_carried: order.remaining_days_carried || 0,
          payment_provider: "freedompay",
          order_id: orderId,
        });
      }

      // Update payment order status with full Freedom Pay metadata
      await supabase
        .from("payment_orders")
        .update({
          status: "success",
          pg_payment_id: pgPaymentId,
          card_mask: params.pg_card_pan ?? null,
          bank_code: params.pg_bank_id ?? null,
          mcc: params.pg_mcc ?? null,
          payment_organization: params.pg_payment_organization ?? 'ТОО "Freedom Pay"',
          phone: params.pg_user_phone ?? null,
          commission: params.pg_commission ? Math.round(Number(params.pg_commission)) : 0,
          payment_method: params.pg_payment_method ?? null,
          paid_at: params.pg_payment_date ?? new Date().toISOString(),
        })
        .eq("order_id", orderId);

      // Send email receipt (квитанция) — fire-and-forget, must not block callback
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
        const recipientEmail = userData?.user?.email;
        if (recipientEmail && plan) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "payment-receipt",
              recipientEmail,
              idempotencyKey: `receipt-${orderId}`,
              templateData: {
                planName: plan.name,
                amount: order.amount,
                currency: "KZT",
                orderId,
                paymentId: pgPaymentId,
                paidAt: params.pg_payment_date ?? new Date().toISOString(),
                expiresAt: order.computed_expires_at,
                bonusDays: order.bonus_days || 0,
              },
            },
          });
          console.log("Receipt email enqueued for", recipientEmail);
        } else {
          console.warn("Receipt skipped — no email for user", order.user_id);
        }
      } catch (emailErr) {
        console.error("Failed to enqueue receipt email:", emailErr);
      }

      // Journal entry — successful payment
      await supabase.from("activity_log").insert({
        user_id: order.user_id,
        type: "payment_success",
        payload_json: {
          event_code: "PAYMENT_SUCCESS",
          order_id: orderId,
          pg_payment_id: pgPaymentId,
          amount: order.amount,
          currency: "KZT",
          plan_id: order.plan_id,
          plan_name: plan?.name ?? null,
          purchase_type: order.purchase_type ?? "new",
          previous_plan_name: order.previous_plan_name ?? null,
          remaining_days_carried: order.remaining_days_carried ?? 0,
          bonus_days: order.bonus_days ?? 0,
          new_expires_at: order.computed_expires_at ?? null,
          provider: "freedom_pay",
          payment_method: params.pg_payment_method ?? null,
          card_pan: params.pg_card_pan ?? null,
          paid_at: params.pg_payment_date ?? new Date().toISOString(),
          occurred_at: new Date().toISOString(),
        },
      });

      console.log("Payment successful, subscription activated for user:", order.user_id);
    } else {
      // Payment failed
      await supabase
        .from("payment_orders")
        .update({
          status: "failed",
          pg_payment_id: pgPaymentId,
          failure_code: params.pg_failure_code ?? null,
          failure_description: params.pg_failure_description ?? null,
        })
        .eq("order_id", orderId);

      // Journal entry — failed payment
      await supabase.from("activity_log").insert({
        user_id: order.user_id,
        type: "payment_failed",
        payload_json: {
          event_code: "PAYMENT_FAILED",
          order_id: orderId,
          pg_payment_id: pgPaymentId,
          amount: order.amount,
          currency: "KZT",
          plan_id: order.plan_id,
          provider: "freedom_pay",
          failure_code: params.pg_failure_code ?? null,
          failure_description: params.pg_failure_description ?? null,
          occurred_at: new Date().toISOString(),
        },
      });

      console.log("Payment failed for order:", orderId);
    }

    // Respond to Freedom Pay
    const responseSalt = crypto.randomUUID();
    const responseParams: Record<string, string> = {
      pg_status: "ok",
      pg_description: "Payment processed",
      pg_salt: responseSalt,
    };
    const sorted = Object.keys(responseParams).sort();
    const values = sorted.map(k => responseParams[k]);
    const sigString = [usedScript, ...values, SECRET_KEY].join(";");
    const responseSig = md5(sigString);

    return new Response(
      `<?xml version="1.0" encoding="utf-8"?><response><pg_status>ok</pg_status><pg_description>Payment processed</pg_description><pg_salt>${responseSalt}</pg_salt><pg_sig>${responseSig}</pg_sig></response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(
      `<?xml version="1.0" encoding="utf-8"?><response><pg_status>error</pg_status><pg_description>Internal error</pg_description></response>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }
});
