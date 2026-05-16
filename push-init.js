// ============================================
// push-init.js — LawyersAI v3.3
// FIX: tombol selalu muncul kecuali sudah granted
// ============================================
(function () {

  const VAPID_PUBLIC_KEY = 'BKArWxpciBnB6q2vr3qg_42j-PUhgZ-pous04tOTODzBjRQjolTrKqG_LowfCn322hyd2aPep6NdQjwyklAfKSo'

  const SW_PATH = './sw.js';

  let _swReg         = null;
  let _unreadCount   = 0;
  let _blinkInterval = null;
  let _originalTitle = document.title || 'Lawyers AI';
  let _msgChannel    = null;
  let _refreshTimer  = null;
  let _lastFavCount  = -1;

  // ── 1. Register Service Worker ──
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: './' });
      _swReg = reg;
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      return reg;
    } catch (e) {
      console.warn('[Push] SW gagal:', e);
      return null;
    }
  }

  // ── 2. Subscribe Push ──
  async function subscribePush(userId) {
    if (!_swReg || !('PushManager' in window) || !('Notification' in window)) return null;
    try {
      let perm = Notification.permission;
      if (perm === 'default') perm = await Notification.requestPermission();
      if (perm !== 'granted') return null;

      let sub = await _swReg.pushManager.getSubscription();
      if (!sub) {
        sub = await _swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8(VAPID_PUBLIC_KEY),
        });
      }

      if (userId && window.supabase) {
        const j = sub.toJSON();
        await window.supabase.from('push_subscriptions').upsert({
          user_id:    userId,
          endpoint:   j.endpoint,
          p256dh:     j.keys?.p256dh,
          auth:       j.keys?.auth,
          user_agent: navigator.userAgent.slice(0, 200),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
      return sub;
    } catch (e) {
      console.warn('[Push] Subscribe error:', e);
      return null;
    }
  }

  // ── 3. Badge ──
  function setTabBadge(count) {
    _unreadCount = Math.max(0, Number(count || 0));
    try {
      if ('setAppBadge' in navigator) {
        _unreadCount > 0 ? navigator.setAppBadge(_unreadCount) : navigator.clearAppBadge();
      }
    } catch (_) {}
    updateFaviconBadge(_unreadCount);
    if (_unreadCount > 0 && document.hidden) {
      startTitleBlink(_unreadCount);
    } else {
      stopTitleBlink();
      document.title = _unreadCount > 0 ? `(${_unreadCount}) ${_originalTitle}` : _originalTitle;
    }
    try {
      if (_swReg?.active) _swReg.active.postMessage({ type: 'SET_BADGE', count: _unreadCount });
    } catch (_) {}
  }

  function updateFaviconBadge(count) {
    if (_lastFavCount === count) return;
    _lastFavCount = count;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = './favicon.ico';
      const draw = () => {
        if (count > 0) {
          ctx.beginPath();
          ctx.arc(22, 10, 9, 0, 2 * Math.PI);
          ctx.fillStyle = '#EF4444';
          ctx.fill();
          ctx.fillStyle = '#FFF';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(count > 9 ? '9+' : String(count), 22, 10);
        }
        let link = document.querySelector("link[rel~='icon']");
        if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
        link.href = canvas.toDataURL();
      };
      img.onload  = () => { ctx.drawImage(img, 0, 0, 32, 32); draw(); };
      img.onerror = () => {
        ctx.fillStyle = '#1E293B'; ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#3B82F6'; ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('L', 16, 24);
        draw();
      };
    } catch (_) {}
  }

  function startTitleBlink(count) {
    if (_blinkInterval) return;
    let show = true;
    _blinkInterval = setInterval(() => {
      document.title = show ? `(${count}) 💬 Pesan Baru!` : _originalTitle;
      show = !show;
    }, 1500);
  }

  function stopTitleBlink() {
    if (!_blinkInterval) return;
    clearInterval(_blinkInterval);
    _blinkInterval = null;
    document.title = _originalTitle;
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      stopTitleBlink();
      if (_unreadCount > 0) document.title = `(${_unreadCount}) ${_originalTitle}`;
    }
  });

  // ── 4. Realtime badge ──
  async function listenMessages(userId) {
    if (!window.supabase || !userId) return;
    if (_msgChannel) {
      try { window.supabase.removeChannel(_msgChannel); } catch (_) {}
    }
    await refreshUnread(userId);
    _msgChannel = window.supabase
      .channel('push-inbox-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, async (payload) => {
        clearTimeout(_refreshTimer);
        _refreshTimer = setTimeout(() => refreshUnread(userId), 300);
        if (!document.hidden) {
          const preview = String(payload.new?.message_text || '').slice(0, 60);
          _showToast('💬 ' + (preview || 'Pesan baru masuk'));
        }
      })
      .subscribe();
  }

  async function refreshUnread(userId) {
    if (!window.supabase || !userId) return;
    try {
      const { count } = await window.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);
      setTabBadge(count || 0);
    } catch (_) {}
  }

  function _showToast(msg) {
    if (typeof window.toast === 'function') { window.toast(msg, 'info'); return; }
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1E293B;color:#fff;border:1px solid rgba(59,130,246,0.4);border-radius:12px;padding:10px 18px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 8px 28px rgba(0,0,0,0.4);pointer-events:none;max-width:300px;font-family:sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(),300); }, 3500);
  }

  // ── 5. Public API ──
  window.clearInboxBadge = async function (userId) {
    setTabBadge(0);
    if (!window.supabase || !userId) return;
    try {
      await window.supabase.from('messages').update({ is_read: true })
        .eq('receiver_id', userId).eq('is_read', false);
    } catch (_) {}
  };

  window.requestPushPermission = async function () {
    const btn = document.getElementById('push-notif-btn');
    if (!('Notification' in window)) {
      _showToast('Browser tidak mendukung notifikasi');
      return;
    }
    if (Notification.permission === 'granted') {
      _showToast('🔔 Notifikasi sudah aktif');
      _setBtnGranted(btn);
      return;
    }
    if (Notification.permission === 'denied') {
      _showToast('⚠️ Buka pengaturan browser → aktifkan notifikasi untuk situs ini');
      _setBtnDenied(btn);
      return;
    }
    // default — tampilkan dialog
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      _showToast('🔔 Notifikasi berhasil diaktifkan!');
      _setBtnGranted(btn);
      if (window.supabase) {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) await subscribePush(user.id);
      }
    } else {
      _showToast('Notifikasi diblokir. Aktifkan di pengaturan browser.');
      _setBtnDenied(btn);
    }
  };

  function _setBtnGranted(btn) {
    if (!btn) return;
    btn.innerHTML = '<i class="fas fa-bell" style="font-size:11px"></i> Notifikasi Aktif ✓';
    btn.style.color  = '#34D399';
    btn.style.border = '1px solid rgba(16,185,129,0.35)';
    btn.style.cursor = 'default';
    btn.onclick = null;
    setTimeout(() => {
      btn.style.transition = 'opacity .4s';
      btn.style.opacity = '0';
      setTimeout(() => { if (btn.parentNode) btn.remove(); }, 450);
    }, 2500);
  }

  function _setBtnDenied(btn) {
    if (!btn) return;
    btn.innerHTML = '<i class="fas fa-bell-slash" style="font-size:11px"></i> Diblokir';
    btn.style.color  = '#94A3B8';
    btn.style.border = '1px solid rgba(148,163,184,0.2)';
    btn.title = 'Klik ikon gembok/info di address bar → izinkan Notifikasi';
  }

  // ── 6. Inject tombol ke <body> ──
  function createNotifButton() {
    if (document.getElementById('push-notif-btn')) return;

    // Sudah granted = tidak perlu tombol
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') return;

    const btn = document.createElement('button');
    btn.id   = 'push-notif-btn';
    btn.type = 'button';
    btn.innerHTML = '<i class="fas fa-bell" style="font-size:11px;pointer-events:none"></i>'
                  + ' <span style="pointer-events:none">Aktifkan Notifikasi</span>';
    btn.style.cssText = [
      'position:fixed',
      'bottom:calc(env(safe-area-inset-bottom,0px) + 72px)',
      'right:16px',
      'z-index:8000',
      'display:inline-flex',
      'align-items:center',
      'gap:6px',
      'padding:8px 14px',
      'border-radius:12px',
      'background:rgba(10,20,40,0.92)',
      'border:1px solid rgba(59,130,246,0.35)',
      'color:#60A5FA',
      'font-size:11px',
      'font-weight:700',
      'cursor:pointer',
      'font-family:inherit',
      'backdrop-filter:blur(14px)',
      '-webkit-backdrop-filter:blur(14px)',
      'box-shadow:0 4px 20px rgba(0,0,0,0.4)',
      'transition:opacity .2s,transform .15s',
      'letter-spacing:0.04em',
    ].join(';');

    btn.onclick = window.requestPushPermission;
    btn.addEventListener('mouseenter', () => { btn.style.opacity='0.82'; btn.style.transform='translateY(-2px)'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity='1';    btn.style.transform='translateY(0)'; });

    document.body.appendChild(btn);
    console.log('[Push] Tombol notifikasi berhasil di-inject, permission:', Notification?.permission);
  }

  // ── Helper ──
  function urlB64ToUint8(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g,'+').replace(/_/g,'/'));
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  // ── Init ──
  async function init() {
    try {
      await registerSW();
      if (!window.supabase) return;
      const { data: { user } } = await window.supabase.auth.getUser();
      if (!user) return;
      await subscribePush(user.id);
      await listenMessages(user.id);
    } catch (e) {
      console.error('[Push] Init gagal:', e);
    }
  }

  window.addEventListener('beforeunload', () => {
    try { if (_msgChannel) window.supabase?.removeChannel(_msgChannel); } catch (_) {}
  });

  function bootstrap() {
    createNotifButton();
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
