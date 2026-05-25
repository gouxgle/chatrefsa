const { body, param, query } = require('express-validator');

const registerValidation = [
  body('email')
    .optional({ values: 'falsy' })
    .isEmail()
    .withMessage('Email inválido'),
  body('confirmEmail')
    .optional({ values: 'falsy' })
    .isEmail()
    .withMessage('Confirmación de email inválida')
    .custom((value, { req }) => {
      if (req.body.email && (!value || value.toLowerCase().trim() !== req.body.email.toLowerCase().trim())) {
        throw new Error('Los correos electrónicos no coinciden');
      }
      return true;
    }),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9._]+$/)
    .withMessage('Username debe tener 3-30 caracteres (letras, números, punto y guión bajo)'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('fullName')
    .optional({ values: 'falsy' })
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre completo: 2-100 caracteres'),
];

const loginValidation = [
  body().custom((_, { req }) => {
    if (!req.body.identifier && !req.body.email && !req.body.username) {
      throw new Error('Se requiere email o username para iniciar sesión');
    }
    return true;
  }),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida'),
];

const messageValidation = [
  body('content')
    .optional()
    .isLength({ max: 4096 })
    .withMessage('El mensaje no puede tener más de 4096 caracteres'),
];

const groupValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del grupo debe tener 2-100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede tener más de 500 caracteres'),
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Email inválido'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token de restablecimiento requerido'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
];

const verifyEmailValidation = [
  body('token').notEmpty().withMessage('Token de verificación requerido'),
];

module.exports = {
  registerValidation,
  loginValidation,
  messageValidation,
  groupValidation,
  paginationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
};
