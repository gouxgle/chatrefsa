const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { prisma } = require('../lib/prisma');
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// GET /push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /push/subscribe
router.post('/subscribe', authenticateToken, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }

  try {
    // Upsert: si ya existe el mismo endpoint, actualizar
    const existing = await prisma.pushSubscription.findFirst({
      where: { userId: req.user.id, endpoint },
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { p256dh: keys.p256dh, auth: keys.auth },
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          id: require('crypto').randomUUID(),
          userId: req.user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Error al guardar suscripción' });
  }
});

// DELETE /push/unsubscribe
router.delete('/unsubscribe', authenticateToken, async (req, res) => {
  const { endpoint } = req.body;
  try {
    await prisma.pushSubscription.deleteMany({
      where: { userId: req.user.id, endpoint },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar suscripción' });
  }
});

module.exports = { router, webpush };
