const express = require('express');
const router = express.Router();
const { 
    login, 
    register, 
    logout, 
    refreshToken, 
    changePassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateLogin, validateRegister, validateChangePassword } = require('../validations/authValidation');

// Routes publiques
router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);

// Routes protégées
router.post('/logout', protect, logout);
router.post('/refresh-token', protect, refreshToken);
router.put('/change-password', protect, validateChangePassword, changePassword);

module.exports = router;