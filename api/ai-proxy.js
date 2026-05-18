// api/ai-proxy.js
// Vercel Serverless Function — Groq backend
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    try {
        const { messages, temperature = 0.7, max_tokens = 3000 } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array required' });
        }

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
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature,
                        max_tokens,
                    }),
                });

                // Rate limit atau overload → coba model berikutnya
                if (response.status === 429 || response.status === 503) {
                    lastError = new Error(`${model} rate limited (${response.status})`);
                    console.warn(`⚠️ ${model} → ${response.status}, mencoba berikutnya...`);
                    continue;
                }

                if (!response.ok) {
                    const errBody = await response.text();
                    throw new Error(`Groq error ${response.status}: ${errBody.substring(0, 200)}`);
                }

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
