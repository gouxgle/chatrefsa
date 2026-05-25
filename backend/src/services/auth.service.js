const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const mailService = require('./mail.service');

class AuthService {
  async register({ email, confirmEmail, username, password, fullName }) {
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // Check if email already exists (only if provided)
    if (normalizedEmail) {
      const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingEmail) {
        throw { status: 409, message: 'El email ya está registrado' };
      }
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw { status: 409, message: 'El nombre de usuario ya existe' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (auto-verified, no email verification required)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username,
        password: hashedPassword,
        fullName: fullName || username,
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        status: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Log action
    await prisma.systemLog.create({
      data: {
        action: 'USER_REGISTERED',
        userId: user.id,
        details: `New user registered: ${username}`,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return { user, ...tokens };
  }

  async login({ identifier, password }) {
    const normalizedInput = identifier.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedInput },
          { username: normalizedInput },
        ]
      }
    });
    if (!user) {
      throw { status: 401, message: 'Credenciales incorrectas' };
    }

    if (user.isBlocked) {
      throw { status: 403, message: 'Tu cuenta ha sido bloqueada. Contacta al administrador.' };
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw { status: 401, message: 'Credenciales incorrectas' };
    }

    // Update online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    // Log action
    await prisma.systemLog.create({
      data: {
        action: 'USER_LOGIN',
        userId: user.id,
        details: `User logged in: ${user.email || user.username}`,
      },
    });

    const tokens = this.generateTokens(user.id);
    const { password: _, resetPasswordToken: __, resetPasswordExpires: ___, verificationToken: ____, ...userWithoutSensitiveInfo } = user;
    return { user: userWithoutSensitiveInfo, ...tokens };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isBlocked: true },
      });

      if (!user || user.isBlocked) {
        throw { status: 401, message: 'Token inválido' };
      }

      return this.generateTokens(user.id);
    } catch (error) {
      throw { status: 401, message: 'Refresh token inválido o expirado' };
    }
  }

  async forgotPassword({ email }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Return success message anyway for security
      return { message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' };
    }

    const resetToken = crypto.randomBytes(16).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    mailService.sendMail({
      to: normalizedEmail,
      subject: 'Restablecer contraseña - Chat REFSA',
      text: `Hola ${user.fullName || user.username},\n\nHas solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace para crear una nueva contraseña:\n\n${resetLink}\n\nO ingresa el siguiente código de restablecimiento en la página correspondiente:\n\n${resetToken}\n\nEste enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este correo.`,
      html: `<p>Hola <strong>${user.fullName || user.username}</strong>,</p><p>Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente botón para continuar:</p><p><a href="${resetLink}" style="display:inline-block;background-color:#00a884;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;font-weight:bold;">Restablecer Contraseña</a></p><p>O ingresa el siguiente token manualmente:</p><pre style="background:#f4f4f4;padding:10px;border-radius:4px;">${resetToken}</pre><p>Este enlace expirará en 1 hora.</p>`,
    }).catch(err => console.error('Error enviando mail de recuperación:', err));

    return { message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.' };
  }

  async resetPassword({ token, newPassword }) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw { status: 400, message: 'El token de restablecimiento es inválido o ha expirado' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'PASSWORD_RESET_SUCCESS',
        userId: user.id,
        details: `Password reset successfully for user: ${user.email}`,
      },
    });

    return { success: true, message: 'Contraseña restablecida correctamente' };
  }

  async verifyEmail({ token }) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw { status: 400, message: 'El token de verificación es inválido' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    await prisma.systemLog.create({
      data: {
        action: 'EMAIL_VERIFIED',
        userId: user.id,
        details: `Email verified successfully: ${user.email}`,
      },
    });

    return { success: true, message: 'Cuenta verificada correctamente' };
  }

  async resendVerification({ email }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      throw { status: 404, message: 'Usuario no encontrado' };
    }

    if (user.isVerified) {
      throw { status: 400, message: 'La cuenta ya está verificada' };
    }

    let token = user.verificationToken;
    if (!token) {
      token = crypto.randomBytes(16).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: token },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

    mailService.sendMail({
      to: normalizedEmail,
      subject: 'Verifica tu cuenta - Chat REFSA',
      text: `Hola ${user.fullName || user.username},\n\nPor favor, verifica tu cuenta haciendo clic en el siguiente enlace:\n\n${verifyLink}\n\nO ingresa el siguiente código de verificación en la página correspondiente:\n\n${token}\n\nSi no solicitaste este registro, por favor ignora este correo.`,
      html: `<p>Hola <strong>${user.fullName || user.username}</strong>,</p><p>Por favor, verifica tu cuenta haciendo clic en el siguiente botón:</p><p><a href="${verifyLink}" style="display:inline-block;background-color:#00a884;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;font-weight:bold;">Verificar Cuenta</a></p><p>O ingresa el siguiente token de verificación manualmente:</p><pre style="background:#f4f4f4;padding:10px;border-radius:4px;">${token}</pre>`,
    }).catch(err => console.error('Error reenviando mail de verificación:', err));

    return { success: true, message: 'Correo de verificación reenviado correctamente' };
  }

  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
