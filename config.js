// ============================================
// config.js - Konfigurasi Jantung Lawyers AI
// Version: 3.1 - OpenRouter & Qwen AI Integrated
// ============================================

// ============================================
// 1. KONFIGURASI SUPABASE
// ============================================
const supabaseUrl = 'https://mrurkzuulwfudkwgwgva.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydXJrenV1bHdmdWRrd2d3Z3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODU1MTAsImV4cCI6MjA4NTE2MTUxMH0.3DuJCyrxX_VQuOM1pyky-M8udFsi6sf6OMawvjZAMOc';

// ============================================
// 2. KONFIGURASI OPENROUTER API KEY (SULTAN)
// ============================================
window.CONFIG = {
    // API KEY OPENROUTER LU (SUDAH TERPASANG BANG!)
    OPENROUTER_API_KEY: "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",
    
    // Model pilihan Sultan (Qwen 2.5 72B - Gratis & Paling Pinter Bahasa Indonesia)
    AI_MODEL: "qwen/qwen-2.5-72b-instruct:free"
};

// Validasi API Key
if (!window.CONFIG.OPENROUTER_API_KEY || window.CONFIG.OPENROUTER_API_KEY.length < 10) {
    console.error("⚠️ API KEY OPENROUTER TIDAK VALID!");
}

// ============================================
// 3. INISIALISASI SUPABASE
// ============================================
try {
    if (typeof supabase !== 'undefined') {
        window.supabase = supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                storage: window.localStorage,
                storageKey: 'lawyers-ai-auth',
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
            }
        });
        console.log("✅ Supabase Connected (localStorage mode)");
    }
} catch (error) {
    console.error("❌ Supabase Connection Failed:", error);
}

// ============================================
// 4. KONSTANTA APLIKASI
// ============================================
window.APP_CONFIG = {
    MESSAGE: { MAX_LENGTH: 5000, PAGE_SIZE: 50, MIN_LENGTH: 1 },
    UI: { TOAST_DURATION: 3000, TYPING_INDICATOR_TIMEOUT: 2000, DEBOUNCE_DELAY: 300, LOADING_DELAY: 500 },
    STATUS: { VERIFIED: 'verified', PENDING: 'pending', REJECTED: 'rejected' },
    
    // Konfigurasi API OpenRouter
    API: {
        ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
        TIMEOUT: 30000
    }
};

// ============================================
// 5. UTILITY FUNCTIONS - SECURITY & UI
// ============================================

window.escapeHtml = function(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

window.showToast = function(message, type = 'info') {
    const existingToast = document.getElementById('app-toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm transition-all transform';
    const colors = { success: 'bg-emerald-500 text-white', error: 'bg-red-500 text-white', warning: 'bg-amber-500 text-white', info: 'bg-blue-500 text-white' };
    toast.className += ' ' + (colors[type] || colors.info);
    toast.innerHTML = `<span>${window.escapeHtml(message)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, window.APP_CONFIG.UI.TOAST_DURATION);
};

window.getAvatarUrl = function(name, customBg = '2563EB') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${customBg}&color=fff&bold=true&size=128`;
};

window.formatDate = function(dateString, includeTime = true) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
    if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; }
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

// ============================================
// 6. SESSION & UI SYNC
// ============================================

window.handleLogout = function() {
    const doLogout = async () => {
        try {
            await window.supabase.auth.signOut();
            localStorage.clear();
            window.location.href = 'login.html';
        } catch (error) { window.showToast('Gagal logout.', 'error'); }
    };
    if (typeof laiConfirm === 'function') {
        laiConfirm({
            title: 'Keluar dari Lawyers AI?',
            message: 'Sesi kamu akan diakhiri. Sampai jumpa lagi!',
            confirmText: 'Ya, Keluar',
            cancelText: 'Batal',
            danger: true,
            onConfirm: doLogout
        });
    } else {
        if (confirm('Yakin ingin keluar?')) doLogout();
    }
};

window.syncGlobalUI = async function(user) {
    if (!user) return;
    try {
        const { data: profile } = await window.supabase.from('profiles').select('*').eq('id', user.id).single();
        const name = profile?.full_name || user.email?.split('@')[0] || 'User';
        const avatarUrl = profile?.avatar_url || window.getAvatarUrl(name);
        
        const elements = { 'side-name': name, 'side-avatar': avatarUrl, 'header-avatar': avatarUrl, 'menu-name': name, 'menu-email': user.email };
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                if (id.includes('avatar')) el.src = value;
                else el.textContent = value;
            }
        });
        console.log("✅ UI synced for Sultan:", name);
    } catch (error) { console.error("UI Sync error:", error); }
};

// ============================================
// 7. SIDEBAR MANAGEMENT
// ============================================

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (!sidebar) return;
    sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('hidden');
};

// ============================================
// 9. GLOBAL THEME SYSTEM (Siang / Malam)
// ============================================

(function() {
    const THEME_KEY = 'lawyers_ai_theme';

    // Inject global light mode CSS sekali
    const styleId = 'lawyers-ai-theme-css';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* ── Global light mode overrides ── */
            body.light { background: #F0F4F8 !important; color: #0F172A !important; }

            /* Sidebar */
            body.light #sidebar { background: #FFFFFF !important; border-color: #E2E8F0 !important; box-shadow: 4px 0 24px rgba(0,0,0,0.06) !important; }
            body.light #sidebar h1 { color: #0F172A !important; }
            body.light #sidebar .nav-link { color: #94A3B8 !important; }
            body.light #sidebar .nav-link:hover { background: #F1F5F9 !important; color: #475569 !important; }
            body.light #sidebar .nav-link.active { background: rgba(59,130,246,0.1) !important; color: #2563EB !important; }
            body.light #sidebar .nav-link .icon-wrap { background: #F1F5F9 !important; }
            body.light #sidebar .text-slate-400, body.light #sidebar .text-slate-500, body.light #sidebar .text-slate-600 { color: #64748B !important; }
            body.light #sidebar p, body.light #sidebar span:not(.nav-link span) { color: #64748B; }

            /* Cards */
            body.light .stat-card, body.light .notif-card, body.light .cat-card {
                background: #FFFFFF !important;
                border-color: #E2E8F0 !important;
                box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
            }
            body.light .stat-card:hover, body.light .notif-card:hover { border-color: #93C5FD !important; }
            body.light .stat-card .text-white, body.light .notif-card .text-white { color: #0F172A !important; }
            body.light .stat-card .text-3xl { color: #0F172A !important; }
            body.light .stat-card .text-slate-400, body.light .stat-card .text-slate-500, body.light .stat-card .text-slate-600,
            body.light .notif-card .text-slate-400, body.light .notif-card .text-slate-500, body.light .notif-card .text-slate-600 { color: #94A3B8 !important; }
            body.light .cat-card p { color: #475569 !important; }
            body.light .cat-card:hover { background: rgba(59,130,246,0.06) !important; }

            /* Section labels, general text */
            body.light .section-label { color: #CBD5E1 !important; }
            body.light .text-white:not(.hero-card .text-white):not(.notif-card .notif-icon *) { color: #0F172A !important; }
            body.light .text-slate-400:not(#sidebar *):not(.hero-card *) { color: #64748B !important; }
            body.light .text-slate-500, body.light .text-slate-600 { color: #94A3B8 !important; }

            /* Member tag / badge */
            body.light .bg-slate-800, body.light .bg-\\[\\#1E293B\\] { background: #E2E8F0 !important; }
            body.light .member-tag { background: #EFF6FF !important; color: #2563EB !important; }

            /* Hero tetap gelap (by design) */
            body.light .hero-card { background: linear-gradient(135deg,#1E3A6E 0%,#2563EB 60%,#1d4ed8 100%) !important; }
            body.light .hero-card * { color: #fff !important; }
            body.light .hero-card a.bg-white\\/8 { background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.2) !important; }

            /* Premium pill */
            body.light .premium-pill { background: linear-gradient(135deg,#FEF3C7,#FDE68A) !important; border-color: rgba(245,158,11,0.5) !important; }
            body.light .premium-pill .prem-title { color: #78350F !important; }
            body.light .premium-pill .prem-sub { color: #B45309 !important; }
            body.light .premium-pill span { color: #92400E !important; background: rgba(120,53,15,0.15) !important; }

            /* Toast */
            body.light .toast { background: #FFFFFF !important; border-color: #E2E8F0 !important; box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important; }
            body.light .toast .text-white { color: #0F172A !important; }
            body.light .toast .text-slate-400 { color: #64748B !important; }

            /* Theme toggle */
            body.light .theme-toggle { background: #BFDBFE !important; border-color: #93C5FD !important; }
            body.light .theme-toggle .knob { transform: translateX(20px); background: #F59E0B !important; }

            /* Buttons */
            body.light .bg-white\\/5, body.light .bg-white\\/\\[0\\.03\\], body.light .bg-white\\/\\[0\\.02\\] { background: #F8FAFC !important; }
            body.light .border-white\\/8, body.light .border-white\\/10 { border-color: #E2E8F0 !important; }

            /* Header logout btn */
            body.light .bg-red-500\\/10 { background: #FEF2F2 !important; }

            /* Scrollbar */
            body.light ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1) !important; }

            /* Chat advokat */
            body.light .blur-header { background: rgba(240,244,248,0.9) !important; backdrop-filter: blur(12px); }
            body.light .message-in { background: #FFFFFF !important; border-color: #E2E8F0 !important; }
            body.light .message-out { background: #2563EB !important; }
            body.light #chatBox { background: #F0F4F8; }

            /* Konsultasi AI */
            body.light .chat-container { background: #F0F4F8 !important; }
            body.light .ai-bubble { background: #FFFFFF !important; border-color: #E2E8F0 !important; color: #0F172A !important; }
            body.light .user-bubble { background: #2563EB !important; color: #fff !important; }

            /* Input fields */
            body.light input, body.light textarea {
                background: #FFFFFF !important;
                border-color: #E2E8F0 !important;
                color: #0F172A !important;
            }
            body.light input::placeholder, body.light textarea::placeholder { color: #94A3B8 !important; }
            body.light input:focus, body.light textarea:focus { border-color: #3B82F6 !important; }

            /* Prevent transition flash on page load */
            body.light-loading * { transition: none !important; }
        `;
        document.head.appendChild(style);
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body?.classList.add('light');
        } else {
            document.body?.classList.remove('light');
        }
        // Update semua toggle button yang ada di halaman
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            const knob = btn.querySelector('.knob');
            if (theme === 'light') {
                btn.classList.add('light-on');
                if (knob) knob.textContent = '☀️';
            } else {
                btn.classList.remove('light-on');
                if (knob) knob.textContent = '🌙';
            }
        });
    }

    // Apply segera — cegah flash
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => applyTheme(saved));
    } else {
        applyTheme(saved);
    }

    // Global functions
    window.toggleTheme = function() {
        const isLight = document.body.classList.contains('light');
        const next = isLight ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
        if (typeof showToast === 'function') {
            showToast(next === 'light' ? '☀️ Mode Siang aktif' : '🌙 Mode Malam aktif', 'info');
        }
    };

    window.getCurrentTheme = function() {
        return localStorage.getItem(THEME_KEY) || 'dark';
    };
})();

// ============================================
// 10. FINAL INITIALIZATION MESSAGE
// ============================================

console.log('✅ Lawyers AI Config v3.1 (OpenRouter Sultan) Loaded!');