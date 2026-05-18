// ============================================
// push-init.js — LawyersAI FINAL
// ============================================

(function () {

  const VAPID_PUBLIC_KEY = 'BMbQeTQ8SjeSbkUDcmBMTaFjrYE4Mk7DZhLZz4WiDY1udAgda3Ef_0f_IL6-LaH_NRQ2dlILJEjCtpYq0LNb98Y';

  const SW_PATH = '/sw.js';

  let _swReg = null;

  // =========================
  // Register Service Worker
  // =========================
  async function registerSW() {

    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service Worker tidak didukung');
      return null;
    }

    try {

      const reg = await navigator.serviceWorker.register(SW_PATH);

      _swReg = reg;

      console.log('[Push] SW registered');

      return reg;

    } catch (err) {

      console.error('[Push] SW gagal:', err);

      return null;
    }
  }

  // =========================
  // Base64 → Uint8
  // =========================
  function urlBase64ToUint8Array(base64String) {

    const padding = '='.repeat((4 - base64String.length % 4) % 4);

    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);

    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // =========================
  // Subscribe Push
  // =========================
  async function subscribePush(userId) {

    if (!_swReg) {
      console.warn('[Push] SW belum ready');
      return null;
    }

    try {

      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        console.warn('[Push] Notification denied');
        return null;
      }

      let subscription =
        await _swReg.pushManager.getSubscription();

      if (!subscription) {

        subscription =
          await _swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });

        console.log('[Push] Subscription dibuat');
      }

      console.log('[Push] Subscription:', subscription);

      // =========================
      // Simpan ke Supabase
      // =========================

      if (window.supabase && userId) {

        const json = subscription.toJSON();

        const { data, error } =
          await window.supabase
            .from('push_subscriptions')
            .upsert({
              user_id: userId,
              endpoint: json.endpoint,
              p256dh: json.keys.p256dh,
              auth: json.keys.auth,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'endpoint'
            });

        if (error) {

          console.error('[Push] Gagal simpan:', error);

        } else {

          console.log('[Push] Subscription tersimpan');

        }
      }

      return subscription;

    } catch (err) {

      console.error('[Push] Subscribe error:', err);

      return null;
    }
  }

  // =========================
  // Public function
  // =========================
  window.requestPushPermission = async function () {

    try {

      if (!window.supabase) {
        console.error('[Push] Supabase belum ada');
        return;
      }

      const {
        data: { user }
      } = await window.supabase.auth.getUser();

      if (!user) {
        console.warn('[Push] User belum login');
        return;
      }

      await subscribePush(user.id);

    } catch (err) {

      console.error('[Push] requestPushPermission error:', err);

    }
  };

  // =========================
  // Init
  // =========================
  async function init() {

    await registerSW();

    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {

      const {
        data: { user }
      } = await window.supabase.auth.getUser();

      if (user) {

        await subscribePush(user.id);

      }
    }

    console.log('[Push] Init selesai');
  }

  // =========================
  // Bootstrap
  // =========================
  if (document.readyState === 'loading') {

    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {

    init();

  }

})();
