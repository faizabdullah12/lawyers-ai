// ============================================
// config.js - Konfigurasi Lawyers AI
// Version: 4.0 - Security & Mobile Hardened
// ============================================

// ============================================
// 1. KONFIGURASI SUPABASE
// ============================================
const supabaseUrl = 'https://mrurkzuulwfudkwgwgva.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydXJrenV1bHdmdWRrd2d3Z3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODU1MTAsImV4cCI6MjA4NTE2MTUxMH0.3DuJCyrxX_VQuOM1pyky-M8udFsi6sf6OMawvjZAMOc';

// ============================================
// 2. KONFIGURASI AI PROXY
// ============================================
window.CONFIG = {
    OPENROUTER_API_KEY: null,
    AI_PROXY_ENDPOINT: '/api/ai-proxy',
    AI_MODEL: "google/gemini-2.5-flash-lite-preview-06-17"
};

// ============================================
// 3. INISIALISASI SUPABASE
// ============================================
(function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error("❌ Supabase SDK not loaded");
        return;
    }
    try {
        window.supabase = supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                storage: window.localStorage,
                storageKey: 'lawyers-ai-auth',
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
            }
        });
        console.log("✅ Supabase Connected");
    } catch (error) {
        console.error("❌ Supabase Connection Failed:", error);
    }
})();

// ============================================
// 4. KONSTANTA APLIKASI
// ============================================
window.APP_CONFIG = {
    MESSAGE: { MAX_LENGTH: 5000, PAGE_SIZE: 50, MIN_LENGTH: 1 },
    UI: { TOAST_DURATION: 3500, TYPING_INDICATOR_TIMEOUT: 2000, DEBOUNCE_DELAY: 300, LOADING_DELAY: 500 },
    STATUS: { VERIFIED: 'verified', PENDING: 'pending', REJECTED: 'rejected' },
    API: { ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions', TIMEOUT: 30000 }
};

// ============================================
// 4.1 REALTIME CHAT ENGINE
// ============================================
window.subscribeRT = function(targetId, userId, callback) {
    if (!targetId || !userId) return null;
    window.supabase.removeAllChannels();
    return window.supabase
        .channel('public:messages:' + userId)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, (payload) => {
            const newMsg = payload.new;
            const isRelevant = (newMsg.sender_id === targetId && newMsg.receiver_id === userId) ||
                               (newMsg.sender_id === userId && newMsg.receiver_id === targetId);
            if (isRelevant && typeof callback === 'function') callback(newMsg);
        })
        .subscribe();
};

// ============================================
// 5. UTILITY FUNCTIONS - SECURITY
// ============================================

// FIX: Escape HTML untuk cegah XSS — versi lebih robust
window.escapeHtml = function(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\//g, "&#x2F;");
};

// FIX: Sanitize URL untuk cegah javascript: injection
window.safeUrl = function(url) {
    if (!url) return '#';
    const trimmed = url.trim();
    if (/^javascript:/i.test(trimmed)) return '#';
    if (/^data:/i.test(trimmed)) return '#';
    return trimmed;
};

// FIX: Rate limiter sederhana untuk form submit
window.RateLimiter = (function() {
    const attempts = {};
    return {
        check: function(key, maxAttempts, windowMs) {
            const now = Date.now();
            if (!attempts[key]) attempts[key] = [];
            attempts[key] = attempts[key].filter(t => now - t < windowMs);
            if (attempts[key].length >= maxAttempts) return false;
            attempts[key].push(now);
            return true;
        },
        reset: function(key) { delete attempts[key]; }
    };
})();

// FIX: Validasi email lebih ketat
window.isValidEmail = function(email) {
    if (!email || typeof email !== 'string') return false;
    if (email.length > 254) return false;
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

// FIX: Validasi password lebih aman
window.isValidPassword = function(pass) {
    if (!pass || typeof pass !== 'string') return false;
    return pass.length >= 6 && /[a-zA-Z]/.test(pass) && /[0-9]/.test(pass);
};

// CHAT IDENTITY UTILITIES
window.getChatPartnerId = function(message, currentUserId) {
    if (!message || !currentUserId) return null;
    if (message.lawyer_id) return message.lawyer_id;
    return message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
};

window.getPartnerProfile = async function(partnerId) {
    if (!partnerId) return { name: 'Pengguna', avatar: window.getAvatarUrl('P'), tag: 'Umum' };
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('full_name, avatar_url, specialization')
            .eq('id', partnerId)
            .single();
        if (error) throw error;
        return {
            name: data?.full_name || 'Pengguna Lawyers AI',
            avatar: data?.avatar_url || window.getAvatarUrl(data?.full_name || 'User'),
            tag: data?.specialization || 'Klien'
        };
    } catch (err) {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user?.email) {
                const fallbackName = user.email.split('@')[0];
                return { name: fallbackName, avatar: window.getAvatarUrl(fallbackName), tag: 'Umum' };
            }
        } catch(e2) {}
        return { name: 'Pengguna', avatar: window.getAvatarUrl('P'), tag: 'Umum' };
    }
};

// FIX: Toast pakai CSS vars, bukan Tailwind (konsisten dengan semua halaman)
window.showToast = function(message, type = 'info') {
    const existingToast = document.getElementById('app-toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.id = 'app-toast';
    const colors = {
        success: { bg: '#10B981', text: '#fff' },
        error:   { bg: '#EF4444', text: '#fff' },
        warning: { bg: '#F59E0B', text: '#fff' },
        info:    { bg: '#3B82F6', text: '#fff' }
    };
    const c = colors[type] || colors.info;
    toast.style.cssText = `
        position:fixed;top:20px;right:16px;z-index:99999;
        padding:12px 18px;border-radius:12px;
        background:${c.bg};color:${c.text};
        font-family:'Plus Jakarta Sans',sans-serif;
        font-size:13px;font-weight:700;
        box-shadow:0 8px 24px rgba(0,0,0,0.25);
        max-width:calc(100vw - 32px);
        word-break:break-word;
        transition:opacity 0.3s ease, transform 0.3s ease;
        transform:translateY(0);opacity:1;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        setTimeout(() => toast.remove(), 350);
    }, window.APP_CONFIG.UI.TOAST_DURATION);
};

window.getAvatarUrl = function(name, customBg = '2563EB') {
    const safeName = encodeURIComponent(String(name || 'U').substring(0, 50));
    return `https://ui-avatars.com/api/?name=${safeName}&background=${customBg}&color=fff&bold=true&size=128`;
};

window.formatDate = function(dateString, includeTime = true) {
    if (!dateString) return '—';
    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
        if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; }
        return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch (e) { return '—'; }
};

// ============================================
// 6. SESSION & UI SYNC
// ============================================
window.syncUserUI = async function() {
    try {
        const { data: { user }, error } = await window.supabase.auth.getUser();
        if (error || !user) return;
        const { data: profile } = await window.supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
        const name = profile?.full_name || user.email?.split('@')[0] || 'User';
        const avatar = profile?.avatar_url || window.getAvatarUrl(name);
        const sn = document.getElementById('side-name');
        const sa = document.getElementById('side-avatar');
        const sc = document.getElementById('side-email');
        if (sn) sn.textContent = window.escapeHtml(name);
        if (sa) sa.src = avatar;
        if (sc) sc.textContent = window.escapeHtml(user.email || '');
        // FIX: Jangan pernah tampilkan "Akun Coba"
        document.querySelectorAll('[data-user-name]').forEach(el => {
            el.textContent = window.escapeHtml(name);
        });
        console.log("✅ UI synced for user:", name);
    } catch (error) { console.error("UI Sync error:", error); }
};

// ============================================
// 7. SIDEBAR MANAGEMENT
// ============================================
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('active');
    if (overlay) {
        overlay.classList.toggle('hidden', !isOpen);
        overlay.style.display = isOpen ? 'block' : 'none';
    }
    // FIX: Prevent body scroll saat sidebar terbuka di mobile
    document.body.style.overflow = isOpen ? 'hidden' : '';
};

// FIX: Tutup sidebar saat tap overlay
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                window.toggleSidebar();
            }
        });
    }
    // FIX: Swipe gesture untuk tutup sidebar di iOS
    let touchStartX = 0;
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active') && dx < -60) {
            window.toggleSidebar();
        }
    }, { passive: true });
});

// ============================================
// 8. GLOBAL THEME SYSTEM
// ============================================
(function() {
    const THEME_KEY = 'lawyers_ai_theme';
    const styleId = 'lawyers-ai-theme-css';

    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* ── Global light mode overrides ── */
            body.light { background: #F0F4F8 !important; color: #0F172A !important; }
            body.light #sidebar { background: #FFFFFF !important; border-color: #E2E8F0 !important; box-shadow: 4px 0 24px rgba(0,0,0,0.06) !important; }
            body.light #sidebar .nav-link { color: #94A3B8 !important; }
            body.light #sidebar .nav-link:hover { background: #F1F5F9 !important; color: #475569 !important; }
            body.light #sidebar .nav-link.active { background: rgba(59,130,246,0.1) !important; color: #2563EB !important; }
            body.light #sidebar .nav-link .icon-wrap { background: #F1F5F9 !important; }
            body.light #sidebar .text-slate-400, body.light #sidebar .text-slate-500 { color: #64748B !important; }
            body.light .stat-card, body.light .notif-card, body.light .cat-card {
                background: #FFFFFF !important; border-color: #E2E8F0 !important;
                box-shadow: 0 2px 12px rgba(0,0,0,0.06) !important;
            }
            body.light .hero-card { background: linear-gradient(135deg,#1E3A6E 0%,#2563EB 60%,#1d4ed8 100%) !important; }
            body.light .hero-card * { color: #fff !important; }
            body.light .toast { background: #FFFFFF !important; border-color: #E2E8F0 !important; }
            body.light .theme-toggle { background: #BFDBFE !important; border-color: #93C5FD !important; }
            body.light .theme-toggle .knob { transform: translateX(20px); background: #F59E0B !important; }
            body.light input, body.light textarea, body.light select {
                background: #FFFFFF !important; border-color: #E2E8F0 !important; color: #0F172A !important;
            }
            body.light input::placeholder, body.light textarea::placeholder { color: #94A3B8 !important; }
            body.light input:focus, body.light textarea:focus { border-color: #3B82F6 !important; }
            body.light .message-in { background: #FFFFFF !important; border-color: #E2E8F0 !important; }
            body.light #chatBox, body.light #chat-box { background: #F0F4F8; }
            body.light .blur-header { background: rgba(240,244,248,0.92) !important; }

            /* Prevent flash */
            html.light-pending * { transition: none !important; }
        `;
        document.head.appendChild(style);
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body?.classList.add('light');
        } else {
            document.body?.classList.remove('light');
        }
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

    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => applyTheme(saved));
    } else {
        applyTheme(saved);
    }

    window.toggleTheme = function() {
        const isLight = document.body.classList.contains('light');
        const next = isLight ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
        window.showToast?.(next === 'light' ? '☀️ Mode Siang aktif' : '🌙 Mode Malam aktif', 'info');
    };

    window.getCurrentTheme = function() {
        return localStorage.getItem(THEME_KEY) || 'dark';
    };
})();

// ============================================
// 9. GLOBAL MOBILE RESPONSIVE CSS
// ============================================
(function() {
    const styleId = 'lai-mobile-css';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* ═══ MOBILE & iOS GLOBAL FIXES ═══ */
        * { -webkit-tap-highlight-color: transparent; }

        /* Fix iOS bounce scroll */
        html { -webkit-overflow-scrolling: touch; }

        /* Fix iOS input zoom (font-size >= 16px) */
        @media (max-width: 768px) {
            input, textarea, select {
                font-size: 16px !important;
            }
        }

        /* Fix sidebar mobile */
        @media (max-width: 1023px) {
            #sidebar {
                position: fixed !important;
                left: 0; top: 0; bottom: 0;
                z-index: 300 !important;
                transform: translateX(-100%);
                transition: transform 0.3s cubic-bezier(0.4,0,0.2,1) !important;
                width: 260px !important;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            #sidebar.active {
                transform: translateX(0) !important;
                box-shadow: 4px 0 32px rgba(0,0,0,0.4);
            }
            #overlay {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.55);
                z-index: 299;
                display: none;
                backdrop-filter: blur(2px);
            }
            .main-scroll { margin-left: 0 !important; }
        }

        /* Mobile header burger */
        .mobile-menu-btn {
            display: none;
            width: 38px; height: 38px;
            border-radius: 10px;
            background: var(--bg-input, rgba(255,255,255,0.05));
            border: 1px solid var(--border, rgba(255,255,255,0.08));
            align-items: center; justify-content: center;
            cursor: pointer; color: var(--text-2, #94A3B8);
            font-size: 14px; flex-shrink: 0;
        }
        @media (max-width: 1023px) { .mobile-menu-btn { display: flex; } }

        /* Fix notif panel */
        #notifPanel {
            position: fixed !important;
            top: 60px; right: 12px;
            width: min(360px, calc(100vw - 24px)) !important;
            z-index: 250;
            background: var(--bg-sidebar, #0C1220);
            border: 1px solid var(--border, rgba(255,255,255,0.08));
            border-radius: 18px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.4);
            max-height: 70vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 16px;
        }
        body.light #notifPanel {
            background: #FFFFFF;
            border-color: #E2E8F0;
            box-shadow: 0 16px 48px rgba(0,0,0,0.15);
        }

        /* Safe area for iOS notch */
        @supports (padding: env(safe-area-inset-bottom)) {
            .bottom-safe { padding-bottom: env(safe-area-inset-bottom); }
            #input-wrap, .chat-input-wrap { padding-bottom: calc(14px + env(safe-area-inset-bottom)); }
        }

        /* Prevent text select on UI elements */
        .theme-toggle, .nav-link, .cat-card, .action-card, .stat-card { user-select: none; }

        /* Touch target minimum size */
        button, a, [onclick] { min-height: 44px; min-width: 44px; }
        .theme-toggle, .notif-dot { min-height: unset; min-width: unset; }

        /* Scrollbar hide untuk mobile */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Fix hero card padding mobile */
        @media (max-width: 640px) {
            .hero-card { padding: 24px 20px !important; }
            .hero-card h3 { font-size: 20px !important; }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 10. SECURE SESSION CHECK HELPER
// ============================================
window.requireAuth = async function(redirectTo = 'login.html') {
    try {
        const { data: { session }, error } = await window.supabase.auth.getSession();
        if (error || !session) {
            window.location.replace(redirectTo);
            return null;
        }
        // FIX: Refresh token bila hampir expired (< 5 menit)
        const expiresAt = session.expires_at;
        if (expiresAt && (expiresAt - Math.floor(Date.now()/1000)) < 300) {
            await window.supabase.auth.refreshSession();
        }
        return session;
    } catch (e) {
        window.location.replace(redirectTo);
        return null;
    }
};

// FIX: Logout bersih — hapus session + channel
window.doLogout = async function() {
    try {
        window.supabase?.removeAllChannels();
        await window.supabase?.auth.signOut();
        // Hapus hanya auth keys, bukan tema/preferensi user
        const keysToKeep = ['lawyers_ai_theme', 'lai_read_notifs'];
        Object.keys(localStorage).forEach(k => {
            if (!keysToKeep.includes(k)) localStorage.removeItem(k);
        });
        window.location.replace('login.html');
    } catch (e) {
        window.location.replace('login.html');
    }
};

console.log('✅ Lawyers AI Config v4.0 (Security + Mobile) Loaded!');
