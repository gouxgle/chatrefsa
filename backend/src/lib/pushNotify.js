const webpush = require('web-push');
const prisma = require('../config/database');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Envía push notification a todos los dispositivos suscritos de un usuario.
 * Ignora errores de suscripciones expiradas (410) y las elimina automáticamente.
 */
async function notifyUser(userId, payload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 60 }
      );
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
}

module.exports = { notifyUser };
