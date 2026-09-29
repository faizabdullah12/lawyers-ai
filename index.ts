// ═══════════════════════════════════════════════════════════
// Supabase Edge Function: send-push
// Deploy: supabase functions deploy send-push
//
// ENV yang harus di-set di Supabase Dashboard → Settings → Edge Functions:
//   VAPID_PUBLIC_KEY  = BEvoH5TBhDValNm12840Q-dZzzJFR68yueF3v64ID1vSMZinsfwkwEctSDdtZfQOOU5bkWgp8JYARtnOfZQI34U
//   VAPID_PRIVATE_KEY = 6Mt-pztAJWEk6pBqeS_xSp_Gs-RNz7VW1BE9jccGMUY
//   VAPID_EMAIL       = mailto:admin@lawyersai.com   (ganti email Anda)
//   SUPABASE_URL      = https://mrurkzuulwfudkwgwgva.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY = <service_role_key dari Supabase Dashboard>
// ═══════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS Headers ──
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── VAPID helper (Deno-native, no npm) ──
async function importVapidKeys(publicKeyB64url: string, privateKeyB64url: string) {
  const publicKeyBytes  = base64urlToBytes(publicKeyB64url)
  const privateKeyBytes = base64urlToBytes(privateKeyB64url)

  const publicKey = await crypto.subtle.importKey(
    'raw', publicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, []
  )
  const privateKey = await crypto.subtle.importKey(
    'pkcs8', privateKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    true, ['deriveKey', 'deriveBits']
  )
  return { publicKey, privateKey }
}

function base64urlToBytes(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded  = base64 + '='.repeat((4 - base64.length % 4) % 4)
  const binary  = atob(padded)
  const bytes   = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function bytesToBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── Build VAPID JWT ──
async function buildVapidJwt(audience: string, email: string, privateKeyB64url: string, publicKeyB64url: string): Promise<string> {
  const header  = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: email,
  }

  const encode  = (obj: object) => bytesToBase64url(new TextEncoder().encode(JSON.stringify(obj)))
  const sigInput = `${encode(header)}.${encode(payload)}`

  const privateKeyBytes = base64urlToBytes(privateKeyB64url)
  const signKey = await crypto.subtle.importKey(
    'pkcs8', privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signKey,
    new TextEncoder().encode(sigInput)
  )
  return `${sigInput}.${bytesToBase64url(sig)}`
}

// ── Send single push ──
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidEmail: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const url      = new URL(subscription.endpoint)
    const audience = `${url.protocol}//${url.host}`
    const jwt      = await buildVapidJwt(audience, vapidEmail, vapidPrivate, vapidPublic)

    const res = await fetch(subscription.endpoint, {
      method:  'POST',
      headers: {
        'Authorization': `vapid t=${jwt},k=${vapidPublic}`,
        'Content-Type':  'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      // Kirim plain text payload — browser decrypt via push encryption
      // Untuk production gunakan library enkripsi AES-GCM
      body: new TextEncoder().encode(payload),
    })

    return { ok: res.ok, status: res.status }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ══════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      receiver_id,   // user_id penerima
      sender_name,   // nama pengirim
      message_text,  // isi pesan
      chat_url,      // URL chat yang dibuka saat notif diklik
    } = await req.json()

    if (!receiver_id) {
      return new Response(
        JSON.stringify({ error: 'receiver_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Ambil subscription dari DB ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', receiver_id)

    if (subErr || !subs?.length) {
      return new Response(
        JSON.stringify({ sent: 0, reason: subErr?.message || 'No subscription' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
    const VAPID_EMAIL   = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@lawyersai.com'

    const notifPayload = JSON.stringify({
      title:  sender_name || 'Pesan Baru — LawyersAI',
      body:   (message_text || 'Ada pesan baru untuk Anda').slice(0, 120),
      icon:   '/icon-192.png',
      badge:  '/badge-72.png',
      tag:    `msg-${receiver_id}`,
      data: {
        url: chat_url || '/chat-advokat.html',
      },
    })

    // ── Kirim ke semua perangkat subscriber ──
    const results = await Promise.allSettled(
      subs.map(sub =>
        sendWebPush(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notifPayload,
          VAPID_PUBLIC,
          VAPID_PRIVATE,
          VAPID_EMAIL
        )
      )
    )

    const sent   = results.filter(r => r.status === 'fulfilled' && (r.value as any).ok).length
    const failed = results.length - sent

    // ── Hapus subscription invalid (410 Gone) ──
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled' && (r.value as any).status === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subs[i].endpoint)
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, total: subs.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
