Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: 'Email and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in database (expires in 10 minutes)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting verification code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email using Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    let emailSent = false;
    let emailError = null;
    
    if (RESEND_API_KEY) {
      try {
        const emailSubject = type === 'password_reset' 
          ? 'Password Reset Verification Code' 
          : 'Email Change Verification Code';
        
        const emailBody = type === 'password_reset'
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p style="color: #666;">You requested to reset your password. Use the verification code below:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 0; color: #333;">${code}</h1>
              </div>
              <p style="color: #666;">This code will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Email Change Request</h2>
              <p style="color: #666;">You requested to change your email address. Use the verification code below:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="font-size: 32px; letter-spacing: 8px; font-weight: bold; margin: 0; color: #333;">${code}</h1>
              </div>
              <p style="color: #666;">This code will expire in 10 minutes.</p>
              <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            </div>
          `;

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Verification <onboarding@resend.dev>',
            to: [email],
            subject: emailSubject,
            html: emailBody,
          }),
        });

        const resendData = await resendResponse.json();
        
        if (!resendResponse.ok) {
          console.error('Resend API error:', resendData);
          emailError = resendData;
        } else {
          console.log(`Email sent successfully to ${email}. ID: ${resendData.id}`);
          emailSent = true;
        }
      } catch (error) {
        console.error('Error sending email:', error);
        emailError = error.message;
      }
    }

    // Return response — never include the raw code in the API response,
    // even if email delivery failed. Leaking it here would let anyone
    // requesting a code for someone else's email read it directly,
    // with no actual proof they own that inbox.
    if (!emailSent) {
      console.error(`Email delivery failed for ${email}:`, emailError);
      return new Response(
        JSON.stringify({
          error: 'Could not send the verification email right now. Please try again shortly, or contact an admin for help.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent to your email',
        emailSent: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});