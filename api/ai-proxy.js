// ============================================
// api/ai-proxy.js — Vercel Serverless Function
// Proxy aman untuk OpenRouter API
// ============================================

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages, model, temperature, max_tokens } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages' });
        }

        // API Key dari Vercel Environment Variable (AMAN!)
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': req.headers.referer || 'https://lawyers-ai.vercel.app',
                'X-Title': 'Lawyers AI'
            },
            body: JSON.stringify({
                model: model || 'deepseek/deepseek-r1:free',
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 3000
            })
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
