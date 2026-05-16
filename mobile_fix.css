/**
 * mobile-fix.js
 * Taruh <script src="mobile-fix.js"></script> di akhir <body> kedua file HTML.
 */

(function () {
    'use strict';

    /* ── 1. THEME TOGGLE ─────────────────────────────── */
    window.toggleTheme = function () {
        var isLight = document.body.classList.toggle('light');
        localStorage.setItem('lawyers_ai_theme', isLight ? 'light' : 'dark');
    };

    /* ── 2. iOS KEYBOARD — scroll chat to bottom ──────── */
    function scrollChatToBottom() {
        var box = document.getElementById('chat-box');
        if (box) requestAnimationFrame(function () { box.scrollTop = box.scrollHeight; });
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function () {
            scrollChatToBottom();
            var inputWrap = document.getElementById('input-wrap') || document.getElementById('chat-input-area');
            if (!inputWrap) return;
            var offsetBottom = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
            inputWrap.style.transform = offsetBottom > 0 ? 'translateY(-' + offsetBottom + 'px)' : '';
        });
    }

    /* ── 3. iOS AudioContext resume ───────────────────── */
    var _audioResumed = false;
    function resumeAudio() {
        if (_audioResumed) return;
        _audioResumed = true;
        if (window.audioCtx && window.audioCtx.state === 'suspended') window.audioCtx.resume();
    }
    document.addEventListener('touchstart', resumeAudio, { once: true, passive: true });
    document.addEventListener('click', resumeAudio, { once: true, passive: true });

    /* ── 4. ANDROID BACK GESTURE ─────────────────────── */
    window.addEventListener('popstate', function () {
        var inboxPanel = document.getElementById('inbox-panel');
        if (inboxPanel && inboxPanel.classList.contains('hidden-mobile')) {
            if (typeof backToInbox === 'function') backToInbox();
            return;
        }
        var convSidebar = document.getElementById('conv-sidebar');
        if (convSidebar && convSidebar.classList.contains('mobile-hidden')) {
            if (typeof backToConvList === 'function') backToConvList();
        }
    });

    /* ── 5. LAST SEEN on resume ───────────────────────── */
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            if (typeof updateMyLastSeen === 'function') updateMyLastSeen();
            if (typeof updateAdvLastSeen === 'function') updateAdvLastSeen();
        }
    });
    window.addEventListener('focus', function () {
        if (typeof updateMyLastSeen === 'function') updateMyLastSeen();
        if (typeof updateAdvLastSeen === 'function') updateAdvLastSeen();
    });

    /* ── 6. PREVENT DOUBLE TAP ZOOM ──────────────────── */
    document.addEventListener('touchend', function (e) {
        var el = e.target && e.target.closest && e.target.closest('button, .qr-chip, .nav-item, .conv-item, .kbtn, .tab-btn');
        if (el) e.preventDefault();
    }, { passive: false });

    /* ── 7. SEARCH INPUT patches ──────────────────────── */
    function patchSearchInputs() {
        document.querySelectorAll('input[type="search"], .search-box input, .conv-search input').forEach(function (el) {
            el.setAttribute('autocomplete', 'off');
            el.setAttribute('autocorrect', 'off');
            el.setAttribute('autocapitalize', 'off');
            el.setAttribute('spellcheck', 'false');
        });
    }

    /* ── 8. NOTIFIKASI BUTTON ─────────────────────────── */
    function injectNotifButton() {
        // Hapus semua button notif yang salah tempat / duplikat
        document.querySelectorAll('button').forEach(function (btn) {
            var onclick = btn.getAttribute('onclick') || '';
            if (onclick.includes('requestPushPermission') && btn.id !== 'notif-fab') {
                btn.remove();
            }
        });

        if (document.getElementById('notif-fab')) return;

        // Jika notifikasi tidak didukung atau sudah granted, skip
        if (!('Notification' in window)) return;

        var fab = document.createElement('button');
        fab.id = 'notif-fab';
        fab.setAttribute('aria-label', 'Aktifkan notifikasi push');
        fab.innerHTML = '<i class="fas fa-bell" style="font-size:13px"></i><span style="font-size:12px;font-weight:700;font-family:\'Plus Jakarta Sans\',sans-serif">Notifikasi</span>';

        Object.assign(fab.style, {
            position: 'fixed',
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
            right: '16px',
            zIndex: '350',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '10px 16px',
            borderRadius: '50px',
            background: 'rgba(15,23,42,0.92)',
            border: '1px solid rgba(59,130,246,0.4)',
            color: '#60A5FA',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            webkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            minHeight: '44px',
            outline: 'none'
        });

        fab.addEventListener('mouseenter', function () {
            if (fab._granted || fab._denied) return;
            fab.style.background = 'rgba(37,99,235,0.85)';
            fab.style.color = '#fff';
            fab.style.transform = 'translateY(-2px)';
            fab.style.boxShadow = '0 8px 28px rgba(37,99,235,0.4)';
        });
        fab.addEventListener('mouseleave', function () {
            if (fab._granted || fab._denied) return;
            fab.style.transform = '';
            fab.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
            applyFabTheme(fab);
        });

        fab.onclick = function () { handleNotifRequest(fab); };

        document.body.appendChild(fab);
        applyFabTheme(fab);
        checkNotifPermission(fab);
    }

    function applyFabTheme(fab) {
        if (fab._granted || fab._denied) return;
        var isLight = document.body.classList.contains('light');
        if (isLight) {
            fab.style.background = 'rgba(239,246,255,0.97)';
            fab.style.borderColor = 'rgba(37,99,235,0.3)';
            fab.style.color = '#2563EB';
            fab.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        } else {
            fab.style.background = 'rgba(15,23,42,0.92)';
            fab.style.borderColor = 'rgba(59,130,246,0.4)';
            fab.style.color = '#60A5FA';
            fab.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        }
    }

    function checkNotifPermission(fab) {
        if (!('Notification' in window)) { fab.style.display = 'none'; return; }
        if (Notification.permission === 'granted') { setFabGranted(fab); }
        else if (Notification.permission === 'denied') { setFabDenied(fab); }
    }

    function handleNotifRequest(fab) {
        if (fab._granted) { showToastMsg('Notifikasi sudah aktif ✓', 'success'); return; }
        if (fab._denied) { showToastMsg('Notifikasi diblokir. Buka pengaturan browser untuk mengaktifkan.', 'warn'); return; }

        // Gunakan fungsi dari push-init.js jika tersedia
        if (typeof window.requestPushPermission === 'function') {
            window.requestPushPermission();
            setTimeout(function () { checkNotifPermission(fab); }, 2000);
            return;
        }

        if (!('Notification' in window)) { showToastMsg('Browser tidak mendukung notifikasi', 'warn'); return; }
        if (Notification.permission === 'granted') { setFabGranted(fab); return; }
        if (Notification.permission === 'denied') { setFabDenied(fab); return; }

        // Request permission
        fab.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="font-size:13px"></i><span style="font-size:12px;font-weight:700;font-family:\'Plus Jakarta Sans\',sans-serif">Meminta izin...</span>';
        fab.disabled = true;
        fab.style.opacity = '0.8';

        Notification.requestPermission().then(function (result) {
            fab.disabled = false;
            fab.style.opacity = '1';
            if (result === 'granted') {
                setFabGranted(fab);
                showToastMsg('🔔 Notifikasi berhasil diaktifkan!', 'success');
            } else if (result === 'denied') {
                setFabDenied(fab);
                showToastMsg('Notifikasi tidak diizinkan', 'warn');
            } else {
                // dismissed
                fab.innerHTML = '<i class="fas fa-bell" style="font-size:13px"></i><span style="font-size:12px;font-weight:700;font-family:\'Plus Jakarta Sans\',sans-serif">Notifikasi</span>';
                applyFabTheme(fab);
            }
        }).catch(function () {
            fab.disabled = false;
            fab.style.opacity = '1';
            fab.innerHTML = '<i class="fas fa-bell" style="font-size:13px"></i><span style="font-size:12px;font-weight:700;font-family:\'Plus Jakarta Sans\',sans-serif">Notifikasi</span>';
        });
    }

    function setFabGranted(fab) {
        fab._granted = true;
        fab.innerHTML = '<i class="fas fa-bell" style="font-size:13px"></i><span style="font-size:12px;font-weight:700;font-family:\'Plus Jakarta Sans\',sans-serif">Aktif ✓</span>';
        fab.style.background = 'rgba(16,185,129,0.15)';
        fab.style.borderColor = 'rgba(16,185,129,0.45)';
        fab.style.color = '#34D399';
        fab.style.cursor = 'default';
        fab.style.boxShadow = '0 4px 16px rgba(16,185,129,0.2)';
        // Auto-hide setelah 4 detik
        setTimeout(function () {
            fab.style.transition = 'opacity 0.4s, transform 0.4s';
            fab.style.opacity = '0';
            fab.style.transform = 'translateY(8px)';
            setTimeout(function () { fab.style.display = 'none'; }, 420);
        }, 4000);
    }

    function setFabDenied(fab) {
        fab._denied = true;
        fab.innerHTML = '<i class="fas fa-bell-slash" style="font-size:13px"></i><span style="font-size:12px;font-weight:700;font-family:\'Plus Jakarta Sans\',sans-serif">Diblokir</span>';
        fab.style.background = 'rgba(239,68,68,0.1)';
        fab.style.borderColor = 'rgba(239,68,68,0.35)';
        fab.style.color = '#F87171';
        fab.style.boxShadow = 'none';
        fab.title = 'Aktifkan notifikasi dari pengaturan browser';
        // Sembunyikan setelah 5 detik
        setTimeout(function () {
            fab.style.transition = 'opacity 0.4s';
            fab.style.opacity = '0';
            setTimeout(function () { fab.style.display = 'none'; }, 420);
        }, 5000);
    }

    function showToastMsg(msg, type) {
        if (typeof toast === 'function') { toast(msg, type || 'info'); return; }
        var container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position:fixed;bottom:calc(80px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;';
            document.body.appendChild(container);
        }
        var el = document.createElement('div');
        var icons = { info: '💬', success: '✅', warn: '⚠️', error: '❌' };
        el.textContent = (icons[type] || '') + ' ' + msg;
        el.style.cssText = 'background:rgba(12,18,32,0.96);border:1px solid rgba(255,255,255,0.12);color:#F1F5F9;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 8px 28px rgba(0,0,0,0.5);pointer-events:auto;';
        container.appendChild(el);
        setTimeout(function () {
            el.style.transition = 'opacity 0.25s';
            el.style.opacity = '0';
            setTimeout(function () { el.remove(); }, 260);
        }, 3500);
    }

    /* ── INIT ─────────────────────────────────────────── */
    function init() {
        // Apply saved theme
        var theme = localStorage.getItem('lawyers_ai_theme');
        if (theme === 'light' && !document.body.classList.contains('light')) {
            document.body.classList.add('light');
        }

        patchSearchInputs();
        injectNotifButton();

        // Watch theme changes → update FAB color
        new MutationObserver(function () {
            var fab = document.getElementById('notif-fab');
            if (fab) applyFabTheme(fab);
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
