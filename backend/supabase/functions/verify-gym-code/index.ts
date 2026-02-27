import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { gymCode } = await req.json();

        if (!gymCode) {
            return new Response(JSON.stringify({ error: 'Gym code is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Initialize Supabase client with SERVICE_ROLE key to bypass RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Check if the gym code exists in the branches table
        const { data: branch, error } = await supabaseAdmin
            .from('branches')
            .select('gym_code')
            .eq('gym_code', gymCode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return new Response(JSON.stringify({ isValid: false }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 404,
                });
            }
            throw error;
        }

        return new Response(JSON.stringify({ isValid: !!branch }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
