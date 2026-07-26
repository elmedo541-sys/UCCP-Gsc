import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { username, password, action } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login') {
      // Verify user credentials
      const { data, error } = await supabase.rpc('verify_user_credentials', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        console.error('Login error:', error);
        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data?.[0];
      
      if (!result?.is_valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid username or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create session token
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          token: sessionToken,
          person_id: result.person_id,
          expires_at: expiresAt.toISOString(),
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          session_token: sessionToken,
          person_id: result.person_id,
          expires_at: expiresAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});