const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
} = require('../middleware/validators');

router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/me', authMiddleware, authController.getMe);

router.post('/forgot-password', authLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, authController.resetPassword);
router.post('/verify-email', authLimiter, verifyEmailValidation, authController.verifyEmail);
router.post('/resend-verification', authLimiter, forgotPasswordValidation, authController.resendVerification);

module.exports = router;
