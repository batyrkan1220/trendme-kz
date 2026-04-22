import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "npm:md5@2.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateSignature(scriptName: string, params: Record<string, string>, secretKey: string): string {
  const sorted = Object.keys(params).sort();
  const values = sorted.map(k => params[k]);
  const sigString = [scriptName, ...values, secretKey].join(";");
  return md5(sigString);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCHANT_ID = Deno.env.get("FREEDOMPAY_MERCHANT_ID");
    const SECRET_KEY = Deno.env.get("FREEDOMPAY_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MERCHANT_ID) throw new Error("FREEDOMPAY_MERCHANT_ID is not configured");
    if (!SECRET_KEY) throw new Error("FREEDOMPAY_SECRET_KEY is not configured");

    // Auth check — use anon client + getClaims for JWT verification (signing-keys system)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing authorization header");

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await authClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) throw new Error("Unauthorized");
    const user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string | undefined };

    // Service role client for DB writes (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { plan_id } = await req.json();
    if (!plan_id) throw new Error("plan_id is required");

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) throw new Error("Plan not found");
    if (plan.price_rub === 0) throw new Error("Cannot purchase free plan");

    // ============ PRORATING / RENEWAL LOGIC ============
    const { data: currentSub } = await supabase
      .from("user_subscriptions")
      .select("*, plans(id, name, price_rub, duration_days)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    let purchaseType: "new" | "renewal" | "upgrade" | "downgrade" = "new";
    let bonusDays = 0;
    let remainingDaysCarried = 0;
    let previousPlanName: string | null = null;
    let previousPlanId: string | null = null;
    let computedExpiresAt: Date;

    const newPlanDays = plan.duration_days;
    const newPlanPrice = plan.price_rub;
    const currentPlan: any = currentSub?.plans;
    const currentExpiresAt = currentSub?.expires_at ? new Date(currentSub.expires_at) : null;
    const isCurrentActive = currentExpiresAt && currentExpiresAt > now;
    const isCurrentPaid = (currentPlan?.price_rub || 0) > 0;

    if (isCurrentActive && currentPlan) {
      previousPlanName = currentPlan.name;
      previousPlanId = currentPlan.id;
      const remainingMs = currentExpiresAt!.getTime() - now.getTime();
      remainingDaysCarried = Math.max(0, Math.ceil(remainingMs / 86400000));

      if (currentPlan.id === plan_id) {
        purchaseType = "renewal";
        computedExpiresAt = new Date(currentExpiresAt!.getTime() + newPlanDays * 86400000);
      } else if (isCurrentPaid) {
        const remainingValueRub =
          (currentPlan.price_rub / currentPlan.duration_days) * remainingDaysCarried;
        const newPlanDailyRate = newPlanPrice / newPlanDays;
        bonusDays = newPlanDailyRate > 0 ? Math.floor(remainingValueRub / newPlanDailyRate) : 0;
        purchaseType = newPlanPrice > currentPlan.price_rub ? "upgrade" : "downgrade";
        computedExpiresAt = new Date(now.getTime() + (newPlanDays + bonusDays) * 86400000);
      } else {
        purchaseType = "new";
        computedExpiresAt = new Date(now.getTime() + newPlanDays * 86400000);
      }
    } else {
      computedExpiresAt = new Date(now.getTime() + newPlanDays * 86400000);
    }
    // ====================================================

    // Create unique order ID
    const orderId = `${user.id.slice(0, 8)}-${plan_id.slice(0, 8)}-${Date.now()}`;

    // Build published URL for callbacks
    const appUrl = "https://trendme.kz";
    const resultUrl = `${SUPABASE_URL}/functions/v1/freedompay-callback`;

    const salt = crypto.randomUUID();

    const params: Record<string, string> = {
      pg_merchant_id: MERCHANT_ID,
      pg_order_id: orderId,
      pg_amount: String(plan.price_rub),
      pg_currency: "KZT",
      pg_description: `trendme подписка: ${plan.name}`,
      pg_salt: salt,
      // pg_testing_mode omitted = production (real cards)
      pg_result_url: resultUrl,
      pg_success_url: `${appUrl}/payment-success?plan=${encodeURIComponent(plan.name)}&amount=${plan.price_rub}`,
      pg_failure_url: `${appUrl}/payment-failure`,
      pg_language: "ru",
      pg_user_id: user.id,
      pg_user_contact_email: user.email || "",
      pg_auto_clearing: "1",
    };

    // Generate signature
    const sig = generateSignature("init_payment.php", params, SECRET_KEY);
    params.pg_sig = sig;

    // Send to Freedom Pay
    const formData = new FormData();
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }

    const response = await fetch("https://api.freedompay.kz/init_payment.php", {
      method: "POST",
      body: formData,
    });

    const xmlText = await response.text();
    console.log("Freedom Pay response:", xmlText);

    // Parse XML response
    const statusMatch = xmlText.match(/<pg_status>(.*?)<\/pg_status>/);
    const redirectMatch = xmlText.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/);
    const paymentIdMatch = xmlText.match(/<pg_payment_id>(.*?)<\/pg_payment_id>/);
    const errorDescMatch = xmlText.match(/<pg_error_description>(.*?)<\/pg_error_description>/);

    const status = statusMatch?.[1];
    const redirectUrl = redirectMatch?.[1];
    const paymentId = paymentIdMatch?.[1];

    if (status !== "ok" || !redirectUrl) {
      const errorDesc = errorDescMatch?.[1] || "Unknown error";
      throw new Error(`Freedom Pay error: ${errorDesc}`);
    }

    // Store pending payment + prorate data — callback will apply it
    await supabase.from("payment_orders").insert({
      order_id: orderId,
      user_id: user.id,
      plan_id: plan_id,
      amount: plan.price_rub,
      pg_payment_id: paymentId,
      status: "pending",
      purchase_type: purchaseType,
      previous_plan_id: previousPlanId,
      previous_plan_name: previousPlanName,
      remaining_days_carried: remainingDaysCarried,
      bonus_days: bonusDays,
      computed_expires_at: computedExpiresAt.toISOString(),
    });

    return new Response(JSON.stringify({ 
      redirect_url: redirectUrl,
      payment_id: paymentId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payment init error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
