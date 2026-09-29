// ============================================
// api/ai-proxy.js — Vercel Serverless Function
// Proxy untuk Groq API (Gratis & Cepat!)
// ============================================

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { messages, temperature, max_tokens } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array required' });
        }

        // Inject system prompt sebagai message pertama
        const messagesWithSystem = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
        ];

        // Model chain — fallback otomatis jika satu limit
        const GROQ_MODELS = [
            'llama-3.3-70b-versatile',  // paling pintar
            'llama-3.1-8b-instant',      // paling cepat
            'gemma2-9b-it',              // cadangan
        ];

        let lastError = null;

        for (const model of GROQ_MODELS) {
            try {
                console.log(`🤖 Mencoba model: ${model}`);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 3000
            })
        });

                const data = await response.json();
                console.log(`✅ Groq berhasil dengan model: ${model}`);
                return res.status(200).json(data);

            } catch (e) {
                lastError = e;
                const isRetryable = /429|503|rate|overload/.test(e.message);
                if (isRetryable) continue;
                throw e;
            }
        }

        // Semua model gagal
        throw new Error(`Semua model Groq sedang sibuk: ${lastError?.message}`);

    } catch (err) {
        console.error('ai-proxy error:', err.message);
        return res.status(500).json({ error: err.message });
    }
}
