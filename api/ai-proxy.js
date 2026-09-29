
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // ── 1. Verifikasi token login Supabase ──
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: token tidak ditemukan' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            return res.status(500).json({ error: 'Server configuration error: SUPABASE_URL/ANON_KEY not set' });
        }

        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${token}`
            }
        });
        if (!userRes.ok) {
            return res.status(401).json({ error: 'Unauthorized: sesi login tidak valid atau kedaluwarsa' });
        }

        // ── 2. Validasi body ──
        const { messages, model, temperature, max_tokens } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: GROQ_API_KEY not set' });
        }

        // ── 3. Teruskan ke Groq ──
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'llama-3.3-70b-versatile',
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
