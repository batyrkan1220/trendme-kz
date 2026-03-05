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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MERCHANT_ID) throw new Error("FREEDOMPAY_MERCHANT_ID is not configured");
    if (!SECRET_KEY) throw new Error("FREEDOMPAY_SECRET_KEY is not configured");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

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

    // Create unique order ID
    const orderId = `${user.id.slice(0, 8)}-${plan_id.slice(0, 8)}-${Date.now()}`;

    // Build published URL for callbacks
    const appUrl = "https://trendme-kz.lovable.app";
    const resultUrl = `${SUPABASE_URL}/functions/v1/freedompay-callback`;

    const salt = crypto.randomUUID();

    const params: Record<string, string> = {
      pg_merchant_id: MERCHANT_ID,
      pg_order_id: orderId,
      pg_amount: String(plan.price_rub),
      pg_currency: "KZT",
      pg_description: `trendme подписка: ${plan.name}`,
      pg_salt: salt,
      pg_testing_mode: "1",
      pg_result_url: resultUrl,
      pg_success_url: `${appUrl}/payment-success`,
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

    // Store pending payment info for callback verification
    // We'll use the order_id to match later
    await supabase.from("payment_orders").insert({
      order_id: orderId,
      user_id: user.id,
      plan_id: plan_id,
      amount: plan.price_rub,
      pg_payment_id: paymentId,
      status: "pending",
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
