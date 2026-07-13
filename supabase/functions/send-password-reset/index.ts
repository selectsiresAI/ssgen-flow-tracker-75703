import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const FROM_EMAIL = Deno.env.get('RESET_PASSWORD_FROM') ?? 'SSGEN Tracker <onboarding@resend.dev>';

    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Serviço de email não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: redirectTo || 'https://ssgen-tracker.lovable.app/reset-password' },
    });

    if (error || !data?.properties?.action_link) {
      console.error('generateLink error:', error);
      return new Response(JSON.stringify({ error: error?.message ?? 'Falha ao gerar link' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const actionLink = data.properties.action_link;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #111;">
        <h2 style="margin: 0 0 16px;">Redefinição de senha</h2>
        <p>Você solicitou a redefinição de senha do <strong>SSGEN Tracker</strong>.</p>
        <p style="margin: 24px 0;">
          <a href="${actionLink}" style="background:#0f172a;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
            Redefinir minha senha
          </a>
        </p>
        <p style="font-size:12px;color:#666;">Se você não solicitou, ignore este email. O link expira em 1 hora.</p>
        <p style="font-size:12px;color:#666;word-break:break-all;">Ou copie e cole no navegador:<br/>${actionLink}</p>
      </div>
    `;

    const resendRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Redefinir sua senha - SSGEN Tracker',
        html,
      }),
    });

    if (!resendRes.ok) {
      const body = await resendRes.text();
      console.error('Resend error:', resendRes.status, body);
      return new Response(
        JSON.stringify({ error: 'Falha no envio', status: resendRes.status, details: body }),
        { status: resendRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('unexpected', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
