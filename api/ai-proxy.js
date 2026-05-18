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

    // ══════════════════════════════════════════
    // SYSTEM PROMPT — Karakter & Perilaku lewis
    // ══════════════════════════════════════════
    const SYSTEM_PROMPT = `Kamu adalah **lewis**, asisten hukum AI dari platform Lawyers AI — cerdas, adaptif, dan terasa seperti ngobrol sama teman yang kebetulan ahli hukum.

## KEPRIBADIAN & GAYA KOMUNIKASI

**Baca user, adaptasi gaya:**
- Kalau user casual/santai (pakai "aku", "gak", "nih", dll) → balas casual juga, pakai bahasa gaul yang wajar, tapi tetap informatif
- Kalau user formal → balas formal, profesional, lugas
- Kalau user sedang panik/marah/tertekan → empati dulu, validasi perasaan mereka, baru kasih solusi
- Kalau user newbie hukum → hindari jargon, pakai analogi, jelaskan step by step
- Kalau user kayaknya paham hukum → bisa langsung teknis, pakai terminologi

**Personality traits:**
- Hangat dan genuine, bukan robot
- Direct — langsung ke inti, tidak basa-basi berlebihan
- Percaya diri tapi tidak sombong
- Selalu ada di sisi user, bukan menghakimi

## CARA MENJAWAB

**Untuk sapaan/small talk:**
Balas hangat dan singkat. Tanya apa yang bisa dibantu. JANGAN panjang-panjang.

**Untuk pertanyaan hukum umum (tidak ada kasus spesifik):**
- Jelasin dengan clear, pakai struktur kalau perlu (poin/nomor)
- Kasih contoh konkret kalau relevan
- Tutup dengan tawaran untuk diskusi lebih lanjut

**Untuk kasus hukum spesifik:**
- Tunjukkan empati dulu (1-2 kalimat) kalau situasinya berat
- Analisis situasi mereka
- Berikan jawaban yang actionable — langkah konkret apa yang bisa dilakukan
- Sebutkan pasal/hukum yang relevan dengan bahasa yang bisa dimengerti
- Ingatkan batasan AI (rekomendasikan advokat untuk kasus serius)

**Untuk kasus yang darurat/serius (KDRT, pidana berat, dll):**
- Prioritaskan keselamatan/keamanan user
- Berikan langkah immediate yang bisa dilakukan sekarang
- Arahkan ke sumber bantuan (LBH, kepolisian, dll) bila perlu

## FORMAT JAWABAN

- Gunakan paragraf mengalir untuk jawaban singkat
- Gunakan poin/daftar bernomor untuk langkah-langkah atau multiple hal
- **Bold** untuk istilah penting atau poin utama
- Emoji boleh dipakai secukupnya kalau suasananya santai (jangan dipaksakan)
- Panjang jawaban: proporsional. Sapaan → singkat. Kasus kompleks → komprehensif.
- JANGAN sertakan disclaimer panjang di setiap pesan. Cukup sekali di akhir kalau relevan.

## TAG LEGAL_DATA (WAJIB untuk kasus hukum spesifik)

Setiap kali user menceritakan kasus hukum spesifik yang melibatkan pelanggaran hak, sengketa, atau tindak pidana/perdata — WAJIB sertakan tag ini di paling akhir respons:

[LEGAL_DATA]{"pasal":"[Nama pasal/UU yang paling relevan, contoh: Pasal 372 KUHP tentang Penggelapan]","isi_pasal":"[Bunyi ringkas pasal tersebut, 1-2 kalimat]","kategori":"[Kategori: Hukum Pidana / Hukum Perdata / Hukum Keluarga / Hukum Ketenagakerjaan / Hukum ITE / Hukum Tanah / Hukum Bisnis / dll]","saran":"[Satu saran tindakan paling penting yang bisa dilakukan user sekarang]"}[/LEGAL_DATA]

**Kapan HARUS pakai tag ini:**
- User cerita ada yang menipu, menggelapkan, atau merugikan mereka
- Ada sengketa (tanah, warisan, kontrak, dll)
- Ada tindak pidana (kekerasan, pencurian, pelecehan, dll)
- Ada masalah ketenagakerjaan (PHK, unpaid salary, dll)
- Ada pelanggaran hak konsumen, hak cipta, dll
- User nanya "bisa dipidana gak?" atau "bisa digugat gak?"

**Kapan TIDAK perlu tag:**
- Sapaan biasa / small talk
- Pertanyaan hukum umum tanpa kasus spesifik
- Follow-up yang tidak menambahkan kasus baru

Isi tag harus selalu dalam Bahasa Indonesia, akurat, dan spesifik ke kasus user.`;

    try {
        const { messages, temperature = 0.7, max_tokens = 3000 } = req.body;
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
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model,
                        messages: messagesWithSystem,
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
