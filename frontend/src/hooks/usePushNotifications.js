import { useEffect } from 'react';
import api from '../api/axios';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        // Registrar SW
        const reg = await navigator.serviceWorker.register('/sw.js');

        // Pedir permiso
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Obtener VAPID public key
        const { data } = await api.get('/push/vapid-public-key');
        const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

        // Suscribir
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // Enviar suscripción al backend
        const subJson = sub.toJSON();
        await api.post('/push/subscribe', {
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        });

        // Manejar click en notificación → navegar
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'NOTIFICATION_CLICK') {
            window.focus();
            window.location.href = event.data.url;
          }
        });
      } catch (err) {
        // Silencioso — push es opcional
      }
    };

    setup();
  }, []);
}
