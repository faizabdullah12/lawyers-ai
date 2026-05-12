// ============================================
// shared-sidebar.js — Lawyers AI v5.0
// Auto-inject sidebar + toast + overlay
// ============================================

(function() {
    // ── NAV CONFIG ──
    const NAV_ITEMS = [
        { href: 'index.html',       icon: 'fa-house',           label: 'Beranda' },
        { href: 'konsultasi.html',  icon: 'fa-robot',           label: 'Chat AI' },
        { href: 'mitra.html',       icon: 'fa-user-tie',        label: 'Partner Ahli' },
        { href: 'chat-advokat.html',icon: 'fa-comments',        label: 'Chat Konsultasi', badge: true },
        { href: 'arsip-kasus.html', icon: 'fa-folder-open',     label: 'Arsip Kasus' },
        { href: 'upgrade.html',     icon: 'fa-crown',           label: 'Upgrade PRO' },
    ];

    // ── DETECT ACTIVE PAGE ──
    function getActivePage() {
        const path = window.location.pathname.split('/').pop() || 'index.html';
        return path;
    }

    // ── BUILD NAV HTML ──
    function buildNav() {
        const active = getActivePage();
        return NAV_ITEMS.map(item => {
            const isActive = active === item.href || (active === '' && item.href === 'index.html');
            const badgeHtml = item.badge
                ? `<span class="nav-badge" id="sidebar-badge-inbox">0</span>`
                : '';
            return `
            <a href="${item.href}" class="nav-link${isActive ? ' active' : ''}">
                <span class="nav-icon"><i class="fas ${item.icon}"></i></span>
                ${item.label}
                ${badgeHtml}
            </a>`;
        }).join('');
    }

    // ── BUILD SIDEBAR HTML ──
    function buildSidebar() {
        return `
        <aside id="sidebar" class="hide-scrollbar">
            <div class="sidebar-logo">
                <h1>Lawyers<span>AI</span></h1>
                <div class="sidebar-online">
                    <span class="sidebar-online-dot"></span>
                    <span class="sidebar-online-label">System Online</span>
                </div>
            </div>
            <nav class="sidebar-nav">
                ${buildNav()}
            </nav>
            <div class="sidebar-premium" onclick="location.href='upgrade.html'" title="Upgrade PRO">
                <div class="sp-head">
                    <div class="sp-crown"><i class="fas fa-crown"></i></div>
                    <span class="sp-tag" id="side-premium-tag">FREE</span>
                </div>
                <p class="sp-title">Akses Advokat<br>Premium Sekarang</p>
                <p class="sp-sub">Upgrade → Rp 150K</p>
            </div>
            <a href="profile.html" class="sidebar-profile">
                <div class="sp-avatar-wrap">
                    <img id="side-avatar" src="https://ui-avatars.com/api/?name=U&background=1E293B&color=60A5FA" class="sp-avatar" alt="Avatar">
                    <span class="sp-status-dot"></span>
                </div>
                <div class="sp-info">
                    <span class="sp-name" id="side-name">Memuat...</span>
                    <span class="sp-view">Lihat Profil →</span>
                </div>
            </a>
        </aside>`;
    }

    // ── INJECT ON DOM READY ──
    function inject() {
        // Toast container
        if (!document.getElementById('toastContainer')) {
            const tc = document.createElement('div');
            tc.id = 'toastContainer';
            document.body.appendChild(tc);
        }

        // Overlay
        if (!document.getElementById('overlay')) {
            const ov = document.createElement('div');
            ov.id = 'overlay';
            ov.onclick = closeSidebar;
            document.body.appendChild(ov);
        }

        // Hamburger
        if (!document.getElementById('menuBtn')) {
            const btn = document.createElement('button');
            btn.id = 'menuBtn';
            btn.setAttribute('aria-label', 'Buka menu');
            btn.innerHTML = '<i class="fas fa-bars" style="font-size:14px;"></i>';
            btn.onclick = toggleSidebar;
            document.body.appendChild(btn);
        }

        // Sidebar (inject before first child to be first flex child)
        if (!document.getElementById('sidebar')) {
            const tmp = document.createElement('div');
            tmp.innerHTML = buildSidebar().trim();
            const sidebarEl = tmp.firstChild;
            document.body.insertBefore(sidebarEl, document.body.firstChild);
        }

        // Load user data
        loadSidebarUser();
        loadInboxBadge();
    }

    // ── LOAD USER ──
    async function loadSidebarUser() {
        try {
            const { data: { session } } = await window.supabase.auth.getSession();
            if (!session) return;
            const { data: profile } = await window.supabase
                .from('profiles')
                .select('full_name, avatar_url, is_premium')
                .eq('id', session.user.id)
                .single();
            if (!profile) return;
            const name = profile.full_name || session.user.email?.split('@')[0] || 'User';
            const avatar = profile.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1E3A5F&color=60A5FA&bold=true`;
            const nameEl = document.getElementById('side-name');
            const avatarEl = document.getElementById('side-avatar');
            const premTag = document.getElementById('side-premium-tag');
            if (nameEl) nameEl.textContent = name;
            if (avatarEl) { avatarEl.src = avatar; avatarEl.alt = name; }
            if (premTag && profile.is_premium) {
                premTag.textContent = 'PRO';
            }
            // Sync any welcome name if present
            const wn = document.getElementById('welcome-name');
            if (wn) wn.textContent = name.split(' ')[0];

            // Cek apakah user adalah advokat terverifikasi → tampilkan link Advokat Panel
            try {
                const { data: mitra } = await window.supabase
                    .from('mitra_ahli')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .eq('status_verifikasi', 'verified')
                    .maybeSingle();

                if (mitra) {
                    const nav = document.querySelector('#sidebar .sidebar-nav');
                    if (nav && !document.getElementById('nav-advokat-panel')) {
                        const activePage = (window.location.pathname.split('/').pop() || 'index.html');
                        const isActive = activePage === 'dashboard-mitra.html';
                        const link = document.createElement('a');
                        link.id = 'nav-advokat-panel';
                        link.href = 'dashboard-mitra.html';
                        link.className = 'nav-link' + (isActive ? ' active' : '');
                        link.style.cssText = 'background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.14);margin-top:6px;';
                        link.innerHTML = '<span class="nav-icon" style="background:rgba(245,158,11,0.14);"><i class="fas fa-scale-balanced" style="color:#F59E0B;"></i></span><span style="color:#F59E0B;letter-spacing:0.07em;">Advokat Panel</span>';
                        nav.appendChild(link);
                    }
                }
            } catch(e) { /* non-mitra user, skip silently */ }

        } catch(e) {
            console.warn('[Sidebar] loadSidebarUser error:', e);
        }
    }

    // ── LOAD INBOX BADGE ──
    async function loadInboxBadge() {
        try {
            const { data: { session } } = await window.supabase.auth.getSession();
            if (!session) return;
            const { count } = await window.supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', session.user.id)
                .eq('is_read', false);
            const badge = document.getElementById('sidebar-badge-inbox');
            if (badge && count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.classList.add('show');
            }
        } catch(e) { /* silent */ }
    }

    // ── SIDEBAR CONTROLS ──
    window.toggleSidebar = function() {
        const s = document.getElementById('sidebar');
        const o = document.getElementById('overlay');
        if (!s) return;
        const open = s.classList.toggle('active');
        if (o) open ? o.classList.add('visible') : o.classList.remove('visible');
    };

    window.closeSidebar = function() {
        const s = document.getElementById('sidebar');
        const o = document.getElementById('overlay');
        if (s) s.classList.remove('active');
        if (o) o.classList.remove('visible');
    };

    // ── TOAST SYSTEM ──
    window.showLALToast = function(type = 'info', title = '', body = '', duration = 4500) {
        const tc = document.getElementById('toastContainer');
        if (!tc) return;
        const cfg = {
            success: { icon: 'fa-check-circle',    bg: 'rgba(16,185,129,0.15)',  color: '#10B981' },
            error:   { icon: 'fa-times-circle',     bg: 'rgba(239,68,68,0.15)',   color: '#EF4444' },
            warning: { icon: 'fa-exclamation-circle',bg:'rgba(245,158,11,0.15)', color: '#F59E0B' },
            info:    { icon: 'fa-info-circle',       bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA' },
        };
        const c = cfg[type] || cfg.info;
        const id = 'toast-' + Date.now();
        const el = document.createElement('div');
        el.id = id;
        el.className = 'lal-toast';
        el.onclick = () => removeToast(id);
        el.innerHTML = `
            <div class="lal-toast-icon" style="background:${c.bg}">
                <i class="fas ${c.icon}" style="color:${c.color}"></i>
            </div>
            <div class="lal-toast-body">
                ${title ? `<div class="lal-toast-title">${title}</div>` : ''}
                ${body  ? `<div class="lal-toast-msg">${body}</div>` : ''}
            </div>
            <button class="lal-toast-close" onclick="event.stopPropagation();removeToast('${id}')">
                <i class="fas fa-times"></i>
            </button>`;
        tc.appendChild(el);
        if (duration > 0) setTimeout(() => removeToast(id), duration);
    };

    window.removeToast = function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('removing');
        setTimeout(() => el.remove(), 300);
    };

    // Legacy alias
    window.showToast = function(msg, type = 'info') {
        window.showLALToast(type, msg, '', 3500);
    };

    // ── LOGOUT ──
    // FIX: Pakai window.doLogout dari config.js agar tema/preferensi tidak ikut terhapus
    window.handleLogout = function() {
        const execLogout = typeof window.doLogout === 'function'
            ? window.doLogout
            : async () => {
                try {
                    await window.supabase.auth.signOut();
                    // FIX: Hapus hanya auth keys, bukan tema/preferensi
                    const keysToKeep = ['lawyers_ai_theme', 'lai_read_notifs'];
                    Object.keys(localStorage).forEach(k => {
                        if (!keysToKeep.includes(k)) localStorage.removeItem(k);
                    });
                    window.location.href = 'login.html';
                } catch(e) {
                    window.showLALToast('error', 'Gagal Logout', 'Coba lagi.');
                }
            };
        if (typeof laiConfirm === 'function') {
            laiConfirm({
                title: 'Keluar dari Lawyers AI?',
                message: 'Sesi kamu akan diakhiri. Sampai jumpa lagi!',
                confirmText: 'Ya, Keluar',
                cancelText: 'Batal',
                type: 'logout',
            }).then(confirmed => { if (confirmed) execLogout(); });
        } else {
            if (confirm('Yakin ingin keluar?')) execLogout();
        }
    };

    // ── APPLY THEME ON LOAD ──
    (function applyThemeEarly() {
        const theme = localStorage.getItem('lawyers_ai_theme') || 'dark';
        if (theme === 'light') document.documentElement.classList.add('light-pending');
    })();

    // ── INJECT SIDEBAR-SPECIFIC MOBILE FIXES ──
    (function injectSidebarMobileCss() {
        const id = 'lai-sidebar-mobile-css';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            /* FIX: iOS safe area untuk sidebar bawah */
            @supports (padding: env(safe-area-inset-bottom)) {
                #sidebar {
                    padding-bottom: calc(8px + env(safe-area-inset-bottom));
                }
                #sidebar .sidebar-profile {
                    margin-bottom: max(20px, env(safe-area-inset-bottom));
                }
            }
            /* FIX: menuBtn tidak boleh overlap konten heading */
            @media (max-width: 1023px) {
                #menuBtn {
                    position: fixed !important;
                    top: max(16px, env(safe-area-inset-top, 16px)) !important;
                    left: 16px !important;
                    z-index: 310 !important;
                }
            }
            /* FIX: Touch target — hanya button/a interaktif, bukan badge/dot */
            button:not(.lal-toast-close):not(#lai-confirm):not(#lai-cancel):not(.lai-modal-btn),
            a.nav-link,
            a.btn-primary,
            a.btn-ghost {
                min-height: 44px !important;
            }
            /* FIX: notif panel z-index lebih tinggi dari overlay */
            #notifPanel { z-index: 320 !important; }
            /* FIX: overlay z-index konsisten */
            #overlay { z-index: 299 !important; }
            #sidebar { z-index: 300 !important; }
            #menuBtn { z-index: 310 !important; }
        `;
        document.head.appendChild(style);
    })();

    // ── BOOT ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();
