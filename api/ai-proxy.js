// ============================================
// api/ai-proxy.js — Lawyers AI
// Vercel Serverless Function
// ============================================

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: 'API key tidak ditemukan.',
            detail: 'Tambahkan OPENROUTER_API_KEY di Vercel → Settings → Environment Variables'
        });
    }

    const { model, messages, temperature = 0.7, max_tokens = 2000 } = req.body;
    if (!model || !messages) {
        return res.status(400).json({ error: 'Parameter model dan messages wajib diisi.' });
    }

    try {
        const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://lawyers-ai.vercel.app',
                'X-Title': 'Lawyers AI'
            },
            body: JSON.stringify({ model, messages, temperature, max_tokens })
        });

        const data = await orRes.json();

        // Teruskan status asli agar fallback MODEL_CHAIN di frontend bekerja
        return res.status(orRes.status).json(data);

    } catch (e) {
        return res.status(503).json({ error: 'Tidak bisa terhubung ke server AI.', detail: e.message });
    }
}