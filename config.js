```js
// ============================================
// config.js - Konfigurasi Lawyers AI
// Version: 4.1 - Stable Realtime Fixed
// ============================================

// ============================================
// 1. KONFIGURASI SUPABASE
// ============================================
const supabaseUrl = 'https://mrurkzuulwfudkwgwgva.supabase.co';

const supabaseKey =
'YOUR_SUPABASE_ANON_KEY';

// ============================================
// 2. KONFIGURASI AI PROXY
// ============================================
window.CONFIG = {
    OPENROUTER_API_KEY: null,
    AI_PROXY_ENDPOINT: '/api/ai-proxy',
    AI_MODEL:
        'google/gemini-2.5-flash-lite-preview-06-17'
};

// ============================================
// 3. INIT SUPABASE
// ============================================

(function initSupabase() {

    if (typeof supabase === 'undefined') {

        console.error(
            '❌ Supabase SDK not loaded'
        );

        return;
    }

    try {

        window.supabase =
            supabase.createClient(
                supabaseUrl,
                supabaseKey,
                {
                    auth: {
                        storage:
                            window.localStorage,

                        storageKey:
                            'lawyers-ai-auth',

                        autoRefreshToken: true,

                        persistSession: true,

                        detectSessionInUrl: false,

                        flowType: 'pkce'
                    },

                    realtime: {
                        params: {
                            eventsPerSecond: 10
                        }
                    },

                    global: {
                        headers: {
                            'X-Client-Info':
                                'lawyers-ai-web'
                        }
                    }
                }
            );

        console.log(
            '✅ Supabase Connected'
        );

    } catch (error) {

        console.error(
            '❌ Supabase Connection Failed:',
            error
        );
    }

})();

// ============================================
// 4. APP CONFIG
// ============================================

window.APP_CONFIG = {

    MESSAGE: {
        MAX_LENGTH: 5000,
        PAGE_SIZE: 50,
        MIN_LENGTH: 1
    },

    UI: {
        TOAST_DURATION: 3500,
        TYPING_INDICATOR_TIMEOUT: 2000,
        DEBOUNCE_DELAY: 300,
        LOADING_DELAY: 500
    },

    STATUS: {
        VERIFIED: 'verified',
        PENDING: 'pending',
        REJECTED: 'rejected'
    },

    API: {
        ENDPOINT:
            'https://openrouter.ai/api/v1/chat/completions',

        TIMEOUT: 30000
    }
};

// ============================================
// 4.1 REALTIME CHAT ENGINE — STABLE
// ============================================

window.__ACTIVE_RT_CHANNELS__ =
    window.__ACTIVE_RT_CHANNELS__ || {};

window.subscribeRT = function (
    targetId,
    userId,
    callback
) {

    if (
        !targetId ||
        !userId ||
        !window.supabase
    ) {
        return null;
    }

    const channelKey =
        `${targetId}:${userId}`;

    // remove old channel
    const oldChannel =
        window.__ACTIVE_RT_CHANNELS__[channelKey];

    if (oldChannel) {

        try {
            oldChannel.unsubscribe();
        } catch (_) {}
    }

    // create channel
    const channel =
        window.supabase
            .channel(
                `messages:${channelKey}:${Date.now()}`
            )

            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {

                    try {

                        const msg =
                            payload.new;

                        if (!msg) return;

                        const isRelevant =

                            (
                                msg.sender_id ===
                                targetId

                                &&

                                msg.receiver_id ===
                                userId
                            )

                            ||

                            (
                                msg.sender_id ===
                                userId

                                &&

                                msg.receiver_id ===
                                targetId
                            );

                        if (!isRelevant) return;

                        if (
                            typeof callback ===
                            'function'
                        ) {

                            callback(msg);
                        }

                    } catch (err) {

                        console.error(
                            '[RT]',
                            err
                        );
                    }
                }
            )

            .subscribe((status) => {

                console.log(
                    '[RT]',
                    status
                );
            });

    window.__ACTIVE_RT_CHANNELS__[channelKey] =
        channel;

    return channel;
};

// ============================================
// UNSUBSCRIBE
// ============================================

window.unsubscribeRT = function (
    targetId,
    userId
) {

    const key =
        `${targetId}:${userId}`;

    const channel =
        window.__ACTIVE_RT_CHANNELS__[key];

    if (!channel) return;

    try {

        channel.unsubscribe();

    } catch (_) {}

    delete
        window.__ACTIVE_RT_CHANNELS__[key];
};

// ============================================
// CLEANUP
// ============================================

window.addEventListener(
    'beforeunload',
    () => {

        try {

            Object.values(
                window.__ACTIVE_RT_CHANNELS__
            ).forEach(channel => {

                try {
                    channel.unsubscribe();
                } catch (_) {}

            });

        } catch (_) {}
    }
);

// ============================================
// 5. SECURITY UTILITIES
// ============================================

window.escapeHtml = function(unsafe) {

    if (
        unsafe === null ||
        unsafe === undefined
    ) {
        return '';
    }

    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// ============================================
// TOAST
// ============================================

window.showToast = function(
    message,
    type = 'info'
) {

    const old =
        document.getElementById(
            'app-toast'
        );

    if (old) old.remove();

    const toast =
        document.createElement('div');

    toast.id = 'app-toast';

    const colors = {

        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };

    toast.style.cssText = `
        position:fixed;
        top:20px;
        right:16px;
        z-index:99999;
        padding:12px 18px;
        border-radius:12px;
        background:${colors[type] || colors.info};
        color:#fff;
        font-family:'Plus Jakarta Sans',sans-serif;
        font-size:13px;
        font-weight:700;
        box-shadow:0 8px 24px rgba(0,0,0,0.25);
        transition:all .3s ease;
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = '0';
        toast.style.transform =
            'translateY(-8px)';

        setTimeout(
            () => toast.remove(),
            300
        );

    }, 3000);
};

// ============================================
// AVATAR
// ============================================

window.getAvatarUrl = function(
    name,
    bg = '2563EB'
) {

    const safe =
        encodeURIComponent(
            String(name || 'U')
        );

    return `https://ui-avatars.com/api/?name=${safe}&background=${bg}&color=fff&bold=true&size=128`;
};

// ============================================
// AUTH CHECK
// ============================================

window.requireAuth =
    async function(
        redirectTo = 'login.html'
    ) {

        try {

            const {
                data: { session }
            } =
                await window.supabase
                    .auth
                    .getSession();

            if (!session) {

                window.location.replace(
                    redirectTo
                );

                return null;
            }

            return session;

        } catch (err) {

            window.location.replace(
                redirectTo
            );

            return null;
        }
    };

// ============================================
// LOGOUT
// ============================================

window.doLogout =
    async function() {

        try {

            window.supabase
                ?.removeAllChannels();

            await window.supabase
                ?.auth
                .signOut();

            localStorage.removeItem(
                'lawyers-ai-auth'
            );

        } catch (_) {}

        window.location.replace(
            'login.html'
        );
    };

console.log(
    '✅ Lawyers AI Config v4.1 Loaded'
);
```
