Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, code, type, newEmail, newPassword } = await req.json();

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Look up the active code for this email/type regardless of the
    // submitted value, so wrong guesses can be counted and capped —
    // without this, a 6-digit code (1 in a million) is brute-forceable
    // by a script within its 10-minute lifetime.
    const { data: activeCode, error: lookupError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('type', type)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError || !activeCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MAX_ATTEMPTS = 5;
    if ((activeCode.attempts ?? 0) >= MAX_ATTEMPTS) {
      await supabase.from('verification_codes').update({ used: true }).eq('id', activeCode.id);
      return new Response(
        JSON.stringify({ error: 'Too many incorrect attempts. Please request a new code.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (activeCode.code !== code) {
      await supabase
        .from('verification_codes')
        .update({ attempts: (activeCode.attempts ?? 0) + 1 })
        .eq('id', activeCode.id);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verificationData = activeCode;

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verificationData.id);

    // Update based on type
    if (type === 'email_change' && newEmail) {
      // Update email in user_auth table
      const { error: updateError } = await supabase
        .from('user_auth')
        .update({ email: newEmail })
        .eq('email', email);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also update in people table
      const { data: authData } = await supabase
        .from('user_auth')
        .select('person_id')
        .eq('email', newEmail)
        .single();

      if (authData) {
        await supabase
          .from('people')
          .update({ email: newEmail })
          .eq('uuid', authData.person_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Email updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'password_reset' && newPassword) {
      // Get username for this email
      const { data: userData } = await supabase
        .from('user_auth')
        .select('username, person_id')
        .eq('email', email)
        .single();

      if (!userData) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update password using the database function
      const { error: updateError } = await supabase.rpc('update_user_password', {
        p_email: email,
        p_password: newPassword
      });

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});