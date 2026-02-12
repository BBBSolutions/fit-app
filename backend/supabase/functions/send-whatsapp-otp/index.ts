import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY") ?? "";
const MSG91_WHATSAPP_INTEGRATED_NUMBER = Deno.env.get("MSG91_WHATSAPP_INTEGRATED_NUMBER") ?? "";
const MSG91_WHATSAPP_TEMPLATE_NAME = Deno.env.get("MSG91_WHATSAPP_TEMPLATE_NAME") ?? "";
const MSG91_WHATSAPP_NAMESPACE = Deno.env.get("MSG91_WHATSAPP_NAMESPACE") ?? null;
const CUSTOM_JWT_SECRET = Deno.env.get("CUSTOM_JWT_SECRET") ?? "SUPER_SECRET_FALLBACK";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { user, phone } = await req.json();

        if (!phone) {
            throw new Error("Missing phone in request body");
        }

        // Generate Random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // MSG91 usually expects number with country code but no + (e.g. 919876543210)
        let formattedPhone = phone.replace('+', '');
        // Auto-prepend 91 if 10 digits
        if (formattedPhone.length === 10) {
            formattedPhone = '91' + formattedPhone;
        }

        console.log(`Sending WhatsApp OTP to ${formattedPhone}`);

        // Construct MSG91 WhatsApp Payload
        const payload = {
            integrated_number: MSG91_WHATSAPP_INTEGRATED_NUMBER,
            content_type: "template",
            payload: {
                messaging_product: "whatsapp",
                type: "template",
                template: {
                    name: MSG91_WHATSAPP_TEMPLATE_NAME,
                    language: {
                        code: "en",
                        policy: "deterministic"
                    },
                    to_and_components: [
                        {
                            to: [formattedPhone],
                            components: {
                                // Variable {{1}} in body "XXXXXX is your verification code"
                                body_1: {
                                    type: "text",
                                    value: otp
                                },
                                // 'Copy Code' button often requires the value explicitly passed as a button component
                                button_1: {
                                    subtype: "url", // MSG91 often maps 'Copy Code' to this subtype in generic payload
                                    type: "text",
                                    value: otp
                                }
                            }
                        }
                    ]
                }
            }
        };

        if (MSG91_WHATSAPP_NAMESPACE) {
            payload.payload.template.namespace = MSG91_WHATSAPP_NAMESPACE;
        }

        const msg91Url = `https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/`;

        const response = await fetch(msg91Url, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "authkey": MSG91_AUTH_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("MSG91 WhatsApp Response:", data);

        if (data.type === "error" || (data.status && data.status === "error")) {
            throw new Error(data.message || "MSG91 failed to send WhatsApp message");
        }

        // Generate HMAC Hash for Stateless Verification
        // MUST MATCH verify-otp-msg91 logic

        // Define Expiry (5 minutes from now)
        const expires = Date.now() + 5 * 60 * 1000;

        // Create Hash: HMAC-SHA256(phone + "." + otp + "." + expires, secret)
        const encoder = new TextEncoder();
        const keyData = encoder.encode(CUSTOM_JWT_SECRET);
        const dataToHash = encoder.encode(`${phone}.${otp}.${expires}`);

        const cryptoKey = await crypto.subtle.importKey(
            "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataToHash);

        // Convert to Hex
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return new Response(JSON.stringify({
            success: true,
            message: "WhatsApp OTP sent successfully",
            hash: hashHex,
            expires: expires
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("WhatsApp Send Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
