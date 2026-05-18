(function () {

  const VAPID_PUBLIC_KEY = 'BMbQeTQ8SjeSbkUDcmBMTaFjrYE4Mk7DZhLZz4WiDY1udAgda3Ef_0f_IL6-LaH_NRQ2dlILJEjCtpYq0LNb98Y';

  let swReg = null;

  async function registerSW() {

    if (!('serviceWorker' in navigator)) {
      console.warn('SW not supported');
      return;
    }

    try {

      swReg = await navigator.serviceWorker.register('/sw.js');

      console.log('SW registered');

    } catch (err) {

      console.error('SW register failed', err);

    }
  }

  function urlBase64ToUint8Array(base64String) {

    const padding = '='.repeat((4 - base64String.length % 4) % 4);

    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);

    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  async function subscribePush(userId) {

    if (!swReg) return;

    let sub = await swReg.pushManager.getSubscription();

    if (!sub) {

      sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

    }

    console.log('SUB:', sub);

    const json = sub.toJSON();

    const { error } = await window.supabase
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

      console.error(error);

    } else {

      console.log('Subscription saved');

    }
  }

  window.requestPushPermission = async function () {

    try {

      const perm = await Notification.requestPermission();

      if (perm !== 'granted') {
        console.warn('Notification denied');
        return;
      }

      const {
        data: { user }
      } = await window.supabase.auth.getUser();

      if (!user) {
        console.warn('No user');
        return;
      }

      await subscribePush(user.id);

    } catch (err) {

      console.error(err);

    }
  };

  async function init() {

    await registerSW();

    console.log('Push init loaded');

  }

  init();

})();
window.addEventListener("load", () => {

  setTimeout(async () => {

    console.log("AUTO PUSH INIT");

    try {

      const {
        data: { user }
      } = await window.supabase.auth.getUser();

      if (!user) {

        console.log("BELUM LOGIN");

        return;

      }

      console.log("USER LOGIN:", user.id);

      await window.requestPushPermission();

    } catch (err) {

      console.error("AUTO PUSH ERROR:", err);

    }

  }, 4000);

});
