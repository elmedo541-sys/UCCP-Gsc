const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, phone, code, newPassword } = await req.json();

    // ── STEP 1: Send code by phone ────────────────────────────────────────────
    if (action === 'send') {
      if (!phone) {
        return new Response(
          JSON.stringify({ error: 'Phone number is required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find person by phone
      const { data: person, error: personErr } = await supabase
        .from('people')
        .select('uuid')
        .eq('phone', phone.trim())
        .maybeSingle();

      if (personErr || !person) {
        return new Response(
          JSON.stringify({ error: 'No account found with that phone number.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find linked user_auth
      const { data: auth, error: authErr } = await supabase
        .from('user_auth')
        .select('email')
        .eq('person_id', person.uuid)
        .maybeSingle();

      if (authErr || !auth) {
        return new Response(
          JSON.stringify({ error: 'No login account is linked to that phone number.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 6-digit code (expires in 10 min)
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertErr } = await supabase
        .from('verification_codes')
        .insert({ email: auth.email, code: verifyCode, type: 'password_reset', expires_at: expiresAt });

      if (insertErr) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate code.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return the code (no SMS — shown to user directly)
      return new Response(
        JSON.stringify({ success: true, code: verifyCode }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── STEP 2: Verify code + reset password ─────────────────────────────────
    if (action === 'verify') {
      if (!phone || !code || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'phone, code, and newPassword are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find person by phone
      const { data: person } = await supabase
        .from('people')
        .select('uuid')
        .eq('phone', phone.trim())
        .maybeSingle();

      if (!person) {
        return new Response(
          JSON.stringify({ error: 'No account found with that phone number.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: auth } = await supabase
        .from('user_auth')
        .select('email')
        .eq('person_id', person.uuid)
        .maybeSingle();

      if (!auth) {
        return new Response(
          JSON.stringify({ error: 'No login account found.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the code
      const { data: vcData, error: vcErr } = await supabase
        .from('verification_codes')
        .select('id')
        .eq('email', auth.email)
        .eq('code', code)
        .eq('type', 'password_reset')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (vcErr || !vcData) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired verification code.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Mark used
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', vcData.id);

      // Reset password
      const { error: resetErr } = await supabase.rpc('update_user_password', {
        p_email: auth.email,
        p_password: newPassword,
      });

      if (resetErr) {
        return new Response(
          JSON.stringify({ error: 'Failed to reset password.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password reset successfully.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
