
// ============================================
// shared-sidebar.js — Lawyers AI v4 Stable
// ============================================

(function () {

    // prevent duplicate inject
    if (window.__SIDEBAR_LOADED__) {
        return;
    }

    window.__SIDEBAR_LOADED__ = true;

    // ============================================
    // SIDEBAR HTML
    // ============================================

    function injectSidebar() {

        if (
            document.getElementById('sidebar')
        ) {
            return;
        }

        const sidebarHTML = `

<div id="overlay"></div>

<aside id="sidebar">

    <div class="sidebar-top">

        <div class="logo-wrap">

            <div class="logo-icon">
                ⚖️
            </div>

            <div>
                <div class="logo-title">
                    Lawyers AI
                </div>

                <div class="logo-sub">
                    Legal Intelligence
                </div>
            </div>

        </div>

        <div class="system-badge">
            ● SYSTEM ONLINE
        </div>

    </div>

    <nav class="sidebar-nav">

        <a href="index.html"
           class="nav-link">

            <div class="icon-wrap">🏠</div>

            <span>Beranda</span>

        </a>

        <a href="chat-ai.html"
           class="nav-link">

            <div class="icon-wrap">🤖</div>

            <span>Chat AI</span>

        </a>

        <a href="partner-ahli.html"
           class="nav-link">

            <div class="icon-wrap">👨‍⚖️</div>

            <span>Partner Ahli</span>

        </a>

        <a href="chat-advokat.html"
           class="nav-link">

            <div class="icon-wrap">💬</div>

            <span>Chat Konsultasi</span>

            <div
                id="sidebar-badge-inbox"
                class="sidebar-badge">

                0
            </div>

        </a>

        <a href="arsip.html"
           class="nav-link">

            <div class="icon-wrap">📁</div>

            <span>Arsip Kasus</span>

        </a>

    </nav>

    <div class="sidebar-premium">

        <div class="premium-top">

            <div class="premium-icon">
                👑
            </div>

            <div class="premium-badge">
                FREE
            </div>

        </div>

        <div class="premium-title">
            Akses Advokat Premium
        </div>

        <div class="premium-sub">
            Upgrade → Rp 150K
        </div>

    </div>

    <div class="sidebar-user">

        <img
            id="side-avatar"
            class="side-avatar"
            src="https://ui-avatars.com/api/?name=U&background=2563EB&color=fff"
        >

        <div class="side-user-info">

            <div id="side-name">
                Memuat...
            </div>

            <div id="side-email">
                loading...
            </div>

            <div id="side-role">
                Member
            </div>

        </div>

    </div>

</aside>
`;

        document.body.insertAdjacentHTML(
            'afterbegin',
            sidebarHTML
        );

        injectSidebarStyles();

        setActiveMenu();
    }

    // ============================================
    // STYLES
    // ============================================

    function injectSidebarStyles() {

        if (
            document.getElementById(
                'sidebar-style'
            )
        ) {
            return;
        }

        const style =
            document.createElement('style');

        style.id = 'sidebar-style';

        style.textContent = `

#sidebar{
    position:fixed;
    left:0;
    top:0;
    bottom:0;
    width:280px;
    background:#081120;
    border-right:1px solid rgba(255,255,255,.06);
    z-index:300;
    padding:18px;
    overflow-y:auto;
}

#overlay{
    display:none;
}

.sidebar-top{
    margin-bottom:24px;
}

.logo-wrap{
    display:flex;
    align-items:center;
    gap:12px;
}

.logo-icon{
    width:42px;
    height:42px;
    border-radius:14px;
    background:#2563EB;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:18px;
}

.logo-title{
    color:#fff;
    font-weight:800;
    font-size:16px;
}

.logo-sub{
    color:#64748B;
    font-size:12px;
}

.system-badge{
    margin-top:16px;
    background:#052E2B;
    color:#10B981;
    font-size:11px;
    padding:8px 12px;
    border-radius:999px;
    width:max-content;
    font-weight:700;
}

.sidebar-nav{
    display:flex;
    flex-direction:column;
    gap:10px;
}

.nav-link{
    display:flex;
    align-items:center;
    gap:14px;
    padding:14px;
    border-radius:16px;
    color:#94A3B8;
    text-decoration:none;
    transition:.2s ease;
    position:relative;
}

.nav-link:hover{
    background:rgba(255,255,255,.04);
    color:#fff;
}

.nav-link.active{
    background:#0F274B;
    color:#3B82F6;
}

.icon-wrap{
    width:38px;
    height:38px;
    border-radius:12px;
    background:rgba(255,255,255,.04);
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:15px;
}

.sidebar-badge{
    margin-left:auto;
    min-width:20px;
    height:20px;
    padding:0 6px;
    border-radius:999px;
    background:#EF4444;
    color:#fff;
    font-size:11px;
    font-weight:700;
    display:none;
    align-items:center;
    justify-content:center;
}

.sidebar-badge.show{
    display:flex;
}

.sidebar-premium{
    margin-top:26px;
    padding:18px;
    border-radius:22px;
    background:linear-gradient(
        135deg,
        rgba(245,158,11,.18),
        rgba(239,68,68,.12)
    );
    border:1px solid rgba(245,158,11,.18);
}

.premium-top{
    display:flex;
    align-items:center;
    justify-content:space-between;
}

.premium-icon{
    width:38px;
    height:38px;
    border-radius:12px;
    background:rgba(0,0,0,.2);
    display:flex;
    align-items:center;
    justify-content:center;
}

.premium-badge{
    font-size:11px;
    background:#F59E0B;
    color:#111827;
    padding:4px 8px;
    border-radius:999px;
    font-weight:800;
}

.premium-title{
    margin-top:14px;
    color:#fff;
    font-weight:800;
    line-height:1.4;
}

.premium-sub{
    margin-top:8px;
    color:#F59E0B;
    font-size:13px;
    font-weight:700;
}

.sidebar-user{
    margin-top:24px;
    display:flex;
    align-items:center;
    gap:12px;
}

.side-avatar{
    width:48px;
    height:48px;
    border-radius:16px;
    object-fit:cover;
    background:#1E293B;
}

.side-user-info{
    min-width:0;
}

#side-name{
    color:#fff;
    font-weight:700;
    font-size:14px;
}

#side-email{
    color:#64748B;
    font-size:12px;
    overflow:hidden;
    text-overflow:ellipsis;
}

#side-role{
    margin-top:4px;
    color:#3B82F6;
    font-size:11px;
    font-weight:700;
}

@media(max-width:1023px){

    #sidebar{
        transform:translateX(-100%);
        transition:.3s ease;
    }

    #sidebar.active{
        transform:translateX(0);
    }

    #overlay.active{
        display:block;
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.45);
        z-index:299;
    }
}
`;

        document.head.appendChild(style);
    }

    // ============================================
    // ACTIVE MENU
    // ============================================

    function setActiveMenu() {

        const path =
            window.location.pathname
                .split('/')
                .pop();

        document
            .querySelectorAll('.nav-link')
            .forEach(link => {

                const href =
                    link.getAttribute('href');

                if (href === path) {
                    link.classList.add('active');
                }
            });
    }

    // ============================================
    // LOAD USER
    // ============================================

    async function loadSidebarUser() {

        try {

            // wait supabase
            let retry = 0;

            while (
                !window.supabase &&
                retry < 30
            ) {

                await new Promise(r =>
                    setTimeout(r, 200)
                );

                retry++;
            }

            if (!window.supabase) {

                console.warn(
                    '[Sidebar] Supabase unavailable'
                );

                return;
            }

            const {
                data: { session },
                error
            } =
                await window.supabase
                    .auth
                    .getSession();

            if (error) {

                console.warn(
                    '[Sidebar] Session error:',
                    error.message
                );

                return;
            }

            if (!session?.user) {

                console.warn(
                    '[Sidebar] No session'
                );

                return;
            }

            const user =
                session.user;

            let profile = null;

            try {

                const {
                    data
                } =
                    await window.supabase
                        .from('profiles')
                        .select(`
                            full_name,
                            avatar_url,
                            role,
                            specialization
                        `)
                        .eq('id', user.id)
                        .single();

                profile = data;

            } catch (_) {}

            const name =
                profile?.full_name
                ||
                user.email?.split('@')[0]
                ||
                'Pengguna';

            const avatar =
                profile?.avatar_url
                ||
                window.getAvatarUrl(name);

            const role =
                profile?.specialization
                ||
                profile?.role
                ||
                'Member';

            const sideName =
                document.getElementById(
                    'side-name'
                );

            const sideEmail =
                document.getElementById(
                    'side-email'
                );

            const sideAvatar =
                document.getElementById(
                    'side-avatar'
                );

            const sideRole =
                document.getElementById(
                    'side-role'
                );

            if (sideName) {
                sideName.textContent =
                    window.escapeHtml(name);
            }

            if (sideEmail) {
                sideEmail.textContent =
                    window.escapeHtml(
                        user.email || ''
                    );
            }

            if (sideAvatar) {
                sideAvatar.src = avatar;
            }

            if (sideRole) {
                sideRole.textContent = role;
            }

            console.log(
                '✅ Sidebar loaded'
            );

        } catch (err) {

            console.error(
                '[Sidebar]',
                err
            );
        }
    }

    // ============================================
    // MOBILE SIDEBAR
    // ============================================

    window.toggleSidebar = function () {

        const sidebar =
            document.getElementById(
                'sidebar'
            );

        const overlay =
            document.getElementById(
                'overlay'
            );

        if (!sidebar) return;

        sidebar.classList.toggle('active');

        overlay?.classList.toggle(
            'active'
        );
    };

    // ============================================
    // INIT
    // ============================================

    injectSidebar();

    window.addEventListener(
        'DOMContentLoaded',
        () => {

            setTimeout(() => {
                loadSidebarUser();
            }, 300);
        }
    );

})();
```
