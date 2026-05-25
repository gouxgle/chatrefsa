const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, confirmEmail, username, password, fullName } = req.body;
    const result = await authService.register({ email, confirmEmail, username, password, fullName });

    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error en el registro' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, email, username, password } = req.body;
    const loginIdentifier = identifier || email || username;

    if (!loginIdentifier) {
      return res.status(400).json({ error: 'Identificador (email o usuario) requerido' });
    }

    const result = await authService.login({ identifier: loginIdentifier, password });

    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error en el login' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const tokens = await authService.refreshToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const result = await authService.forgotPassword({ email });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error en la solicitud' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;
    const result = await authService.resetPassword({ token, newPassword });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error al restablecer la contraseña' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.body;
    const result = await authService.verifyEmail({ token });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error al verificar el correo' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const result = await authService.resendVerification({ email });
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error al reenviar la verificación' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
