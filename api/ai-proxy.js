module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) return res.status(500).json({ error: 'API key tidak dikonfigurasi.' });

    try {
        const { model, messages, temperature = 0.7, max_tokens = 2000 } = req.body;
        if (!model || !messages) return res.status(400).json({ error: 'Parameter model dan messages wajib diisi.' });

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://lawyers-ai.vercel.app',
                'X-Title': 'Lawyers AI'
            },
            body: JSON.stringify({ model, messages, temperature, max_tokens })
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json(data);
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', detail: error.message });
    }
};
