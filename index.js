// ============================================
// supabase/functions/send-reminder/index.js
// Email Reminder Jadwal Konsultasi — JS version
//
// Deploy: supabase functions deploy send-reminder
// Cron:   Supabase Dashboard > Database > Cron Jobs
//         Schedule: "0 * * * *" (setiap jam)
// ============================================

import { serve }        from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL           = 'noreply@lawyers-ai.id';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  try {
    const now       = new Date();
    const in24hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Ambil jadwal yang belum dikirim remindernya
    const { data: schedules, error } = await supabase
      .from('consultation_schedules')
      .select(`
        id,
        scheduled_at,
        status,
        notes,
        user:profiles!user_id ( full_name ),
        lawyer:profiles!lawyer_id ( full_name ),
        user_auth:auth.users!user_id ( email )
      `)
      .in('status', ['confirmed', 'pending'])
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', in24hours.toISOString())
      .eq('reminder_sent', false);

    if (error) throw error;
    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'Tidak ada jadwal' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let sentCount = 0;

    for (const schedule of schedules) {
      const scheduledDate = new Date(schedule.scheduled_at);
      const diffMs        = scheduledDate.getTime() - now.getTime();
      const diffHours     = diffMs / (1000 * 60 * 60);

      if (diffHours > 24) continue;

      const userName   = schedule.user?.full_name  || 'Klien';
      const lawyerName = schedule.lawyer?.full_name || 'Advokat';
      const userEmail  = schedule.user_auth?.email  || null;

      if (!userEmail) continue;

      const timeLabel = diffHours <= 1
        ? '1 jam lagi'
        : `${Math.round(diffHours)} jam lagi`;

      const formattedDate = scheduledDate.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      });

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    `Lawyers AI <${FROM_EMAIL}>`,
          to:      [userEmail],
          subject: `⏰ Pengingat: Konsultasi dengan ${lawyerName} — ${timeLabel}`,
          html:    buildEmailHtml({ userName, lawyerName, formattedDate, timeLabel, notes: schedule.notes }),
        }),
      });

      if (emailRes.ok) {
        await supabase
          .from('consultation_schedules')
          .update({ reminder_sent: true, reminder_sent_at: now.toISOString() })
          .eq('id', schedule.id);
        sentCount++;
        console.log(`✅ Reminder sent → ${userEmail}`);
      } else {
        const errText = await emailRes.text();
        console.error(`❌ Email gagal (${schedule.id}):`, errText);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, total: schedules.length }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('send-reminder error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ── EMAIL TEMPLATE ──
function buildEmailHtml({ userName, lawyerName, formattedDate, timeLabel, notes }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Pengingat Konsultasi</title>
</head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1E;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0F1729;border:1px solid rgba(255,255,255,0.07);border-radius:20px;overflow:hidden;">

        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#2563EB);padding:28px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.14em;">Lawyers AI</p>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#fff;font-style:italic;">⏰ Pengingat Konsultasi</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#CBD5E1;line-height:1.6;">
              Halo <strong style="color:#fff;">${userName}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.7;">
              Sesi konsultasi hukum Anda dijadwalkan
              <strong style="color:#60A5FA;">${timeLabel}</strong>.
            </p>

            <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:14px;padding:20px;margin-bottom:24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0;font-size:10px;font-weight:700;color:#60A5FA;text-transform:uppercase;letter-spacing:0.12em;">Advokat</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#fff;">${lawyerName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:${notes ? '12px' : '0'};">
                    <p style="margin:0;font-size:10px;font-weight:700;color:#60A5FA;text-transform:uppercase;letter-spacing:0.12em;">Waktu</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#fff;">${formattedDate} WIB</p>
                  </td>
                </tr>
                ${notes ? `
                <tr>
                  <td>
                    <p style="margin:0;font-size:10px;font-weight:700;color:#60A5FA;text-transform:uppercase;letter-spacing:0.12em;">Catatan</p>
                    <p style="margin:4px 0 0;font-size:14px;color:#CBD5E1;line-height:1.6;">${notes}</p>
                  </td>
                </tr>` : ''}
              </table>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://lawyers-ai.id/chat-advokat.html"
                    style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:14px;font-size:13px;font-weight:800;
                      text-transform:uppercase;letter-spacing:0.1em;">
                    Buka Chat Konsultasi →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
              Perlu membatalkan? Hubungi advokat melalui chat.<br>
              <a href="https://lawyers-ai.id" style="color:#60A5FA;text-decoration:none;">lawyers-ai.id</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:10px;color:#334155;">
              © ${new Date().getFullYear()} Lawyers AI · Jl. Hukum Digital No. 1, Jakarta
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
