const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');

class MailService {
  constructor() {
    this.transporter = null;
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendMail({ to, subject, html, text }) {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Chat REFSA" <noreply@empresa.com>',
          to,
          subject,
          text,
          html,
        });
        console.log(`📧 Correo real enviado a ${to} con asunto: "${subject}"`);
        return true;
      } catch (err) {
        console.error('❌ Error al enviar correo real:', err);
      }
    }

    // Mock flow in development
    console.log(`\n================= MOCK EMAIL =================`);
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Texto:\n${text}`);
    console.log(`==============================================\n`);

    // 1. Write to local log file in uploads
    try {
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const logFile = path.join(uploadDir, 'emails.log');
      const logEntry = `[${new Date().toISOString()}] Para: ${to} | Asunto: ${subject}\nTexto:\n${text}\n--------------------------------------------------\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (e) {
      console.error('❌ Error al escribir emails.log:', e);
    }

    // 2. Create a SystemLog in database for testing in Admin Dashboard
    try {
      const user = await prisma.user.findUnique({ where: { email: to } });
      await prisma.systemLog.create({
        data: {
          action: 'EMAIL_SENT_MOCK',
          userId: user?.id || null,
          details: `Email simulado a ${to} - Asunto: "${subject}" - Enlace/Token: "${text.replace(/\n/g, ' ')}"`,
        },
      });
    } catch (e) {
      console.error('❌ Error al crear log del email mock en BD:', e);
    }

    return true;
  }
}

module.exports = new MailService();
