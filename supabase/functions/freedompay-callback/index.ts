import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function md5(text: string): string {
  const hash = createHash("md5");
  hash.update(text);
  return hash.toString("hex");
}

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

    // Verify signature
    const isValid = verifySignature("result_notify", params, SECRET_KEY);
    if (!isValid) {
      console.error("Invalid signature in callback");
      return new Response(
        `<?xml version="1.0" encoding="utf-8"?><response><pg_status>error</pg_status><pg_description>Invalid signature</pg_description></response>`,
        { headers: { "Content-Type": "application/xml" } }
      );
    }

    const orderId = params.pg_order_id;
    const pgResult = params.pg_result; // 1 = success, 0 = failure
    const pgPaymentId = params.pg_payment_id;

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

    if (pgResult === "1") {
      // Payment successful - activate subscription
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

        // Create new subscription
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

        await supabase.from("user_subscriptions").insert({
          user_id: order.user_id,
          plan_id: order.plan_id,
          expires_at: expiresAt.toISOString(),
          note: `Freedom Pay #${pgPaymentId}`,
        });
      }

      // Update payment order status
      await supabase
        .from("payment_orders")
        .update({ status: "success", pg_payment_id: pgPaymentId })
        .eq("order_id", orderId);

      console.log("Payment successful, subscription activated for user:", order.user_id);
    } else {
      // Payment failed
      await supabase
        .from("payment_orders")
        .update({ status: "failed", pg_payment_id: pgPaymentId })
        .eq("order_id", orderId);

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
    const sigString = ["result_notify", ...values, SECRET_KEY].join(";");
    const responseSig = await md5(sigString);

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
