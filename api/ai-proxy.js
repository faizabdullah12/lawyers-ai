// ============================================
// api/ai-proxy.js — Vercel Serverless Function
// Proxy untuk Groq API (Gratis & Cepat!)
// ============================================

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { messages, temperature, max_tokens } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: GROQ_API_KEY not set' });
        }

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
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('Groq proxy error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
