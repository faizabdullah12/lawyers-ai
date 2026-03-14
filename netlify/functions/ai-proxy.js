// ============================================
// netlify/functions/ai-proxy.js
// Lawyers AI — OpenRouter Proxy
// API Key aman di Netlify Environment Variable
// ============================================

exports.handler = async function(event, context) {
    // ── CORS preflight ──
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return respond(405, { error: 'Method not allowed' });
    }

    // ── Ambil API key dari environment variable Netlify ──
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENROUTER_API_KEY tidak ditemukan di environment variables!');
        return respond(500, {
            error: 'Konfigurasi server bermasalah. API key tidak ditemukan.',
            detail: 'Tambahkan OPENROUTER_API_KEY di Netlify → Site Settings → Environment Variables'
        });
    }

    // ── Parse body ──
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch(e) {
        return respond(400, { error: 'Body tidak valid (bukan JSON).' });
    }

    const { model, messages, temperature = 0.7, max_tokens = 3000 } = body;

    if (!model || !messages || !Array.isArray(messages)) {
        return respond(400, { error: 'Parameter model dan messages wajib diisi.' });
    }

    // ── Forward ke OpenRouter ──
    try {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://lawyers-ai.netlify.app',
                'X-Title': 'Lawyers AI'
            },
            body: JSON.stringify({ model, messages, temperature, max_tokens })
        });

        const responseText = await orRes.text();

        // Teruskan status asli dari OpenRouter ke client
        // Ini penting agar fallback MODEL_CHAIN di frontend bisa bekerja
        if (!orRes.ok) {
            console.warn(`⚠️ OpenRouter ${orRes.status} untuk model ${model}:`, responseText.substring(0, 200));
            return {
                statusCode: orRes.status,
                headers: corsHeaders(),
                body: responseText
            };
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch(e) {
            return respond(502, { error: 'Respons dari OpenRouter tidak valid.' });
        }

        return {
            statusCode: 200,
            headers: corsHeaders(),
            body: JSON.stringify(data)
        };

    } catch(e) {
        console.error('❌ Fetch ke OpenRouter gagal:', e.message);
        return respond(503, {
            error: 'Tidak bisa terhubung ke server AI.',
            detail: e.message
        });
    }
};

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
}

function respond(status, data) {
    return {
        statusCode: status,
        headers: corsHeaders(),
        body: JSON.stringify(data)
    };
}