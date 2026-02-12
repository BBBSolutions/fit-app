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

        // MSG91 usually expects number with country code but no + (e.g. 919876543210)
        const formattedPhone = phone.replace('+', '');

        console.log(`Sending OTP to ${formattedPhone} (Original: ${phone})`);


        // Construct MSG91 URL (Using Flow or Standard API)
        // Assuming using the modern Flow API or Standard Send API.
        // Example using Standard V5 API or Flow API depending on configuration.
        // Let's use the standard "Send SMS" endpoint for OTP which is often robust.
        // Or normally template based.

        // For OTP, MSG91 has a dedicated OTP API, but Supabase sends the code.
        // So we just need to deliver the message content.

        // Using OTP API (Required for Verify API to work)
        // URL: https://api.msg91.com/api/v5/otp

        const msg91Url = `https://api.msg91.com/api/v5/otp?authkey=${MSG91_AUTH_KEY}&template_id=${MSG91_TEMPLATE_ID}&mobile=${formattedPhone}&otp=${otp}`;

        const response = await fetch(msg91Url, {
            method: "POST", // MSG91 OTP API supports POST/GET
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({}) // Body not needed for query params but POST might require empty body
        });

        const data = await response.json();
        console.log("MSG91 Response:", data);

        if (data.type === "error") {
            throw new Error(data.message || "MSG91 failed to send SMS");
        }

        // Generate HMAC Hash for Stateless Verification
        // Use CUSTOM_JWT_SECRET or fallback to a hardcoded secret for dev if needed (env better)
        const HASH_SECRET = Deno.env.get("CUSTOM_JWT_SECRET") || "SUPER_SECRET_FALLBACK";

        // Create Hash: HMAC-SHA256(phone + "." + otp, secret)
        const encoder = new TextEncoder();
        const keyData = encoder.encode(HASH_SECRET);
        const dataToHash = encoder.encode(`${phone}.${otp}`);

        const cryptoKey = await crypto.subtle.importKey(
            "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataToHash);

        // Convert to Hex
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return new Response(JSON.stringify({
            success: true,
            message: "SMS sent successfully",
            hash: hashHex // Return hash to client (client returns it during verify)
        }), {
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
