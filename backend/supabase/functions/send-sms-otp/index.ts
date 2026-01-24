import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY") ?? "";
const MSG91_TEMPLATE_ID = Deno.env.get("MSG91_TEMPLATE_ID") ?? "";
const MSG91_SENDER_ID = Deno.env.get("MSG91_SENDER_ID") ?? "FITAPP"; // Default sender ID

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { user, otp, phone } = await req.json();

        if (!phone || !otp) {
            throw new Error("Missing phone or OTP in request body");
        }

        console.log(`Sending OTP to ${phone}`);

        // Construct MSG91 URL (Using Flow or Standard API)
        // Assuming using the modern Flow API or Standard Send API.
        // Example using Standard V5 API or Flow API depending on configuration.
        // Let's use the standard "Send SMS" endpoint for OTP which is often robust.
        // Or normally template based.

        // For OTP, MSG91 has a dedicated OTP API, but Supabase sends the code.
        // So we just need to deliver the message content.

        // Using Flow API (Recommended for DLT)
        // POST https://api.msg91.com/api/v5/flow/

        const response = await fetch("https://api.msg91.com/api/v5/flow/", {
            method: "POST",
            headers: {
                "authkey": MSG91_AUTH_KEY,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                template_id: MSG91_TEMPLATE_ID,
                sender: MSG91_SENDER_ID,
                short_url: "0",
                mobiles: phone,
                // Variables mapped in your MSG91 template
                // e.g., if template satisfies "Your OTP is ##OTP##"
                otp: otp,
                // Add other variables if needed
            }),
        });

        const data = await response.json();
        console.log("MSG91 Response:", data);

        if (data.type === "error") {
            throw new Error(data.message || "MSG91 failed to send SMS");
        }

        return new Response(JSON.stringify({ success: true, message: "SMS sent successfully" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("SMS Send Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
