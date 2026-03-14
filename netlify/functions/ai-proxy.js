// ============================================
// netlify/functions/ai-proxy.js
// Proxy aman untuk OpenRouter API
// API Key TIDAK pernah terekspos ke browser!
// ============================================

exports.handler = async function(event, context) {
    // Hanya izinkan POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // CORS headers — izinkan dari domain Netlify kamu
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { messages, model, temperature, max_tokens } = JSON.parse(event.body);

        // Validasi input
        if (!messages || !Array.isArray(messages)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid messages' }) };
        }

        // API Key diambil dari Netlify Environment Variable (AMAN!)
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY environment variable not set!');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error' }) };
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://lawyers-ai.netlify.app',
                'X-Title': 'Lawyers AI'
            },
            body: JSON.stringify({
                model: model || 'google/gemma-3-27b-it:free',
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 3000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('OpenRouter error:', response.status, data);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify(data)
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error', message: error.message })
        };
    }
};