const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const responsableRoutes = require('./responsableRoutes');
const employerRoutes = require('./employerRoutes');
const userRoutes = require('./userRoutes');
const reclamationRoutes = require('./reclamationRoutes');
const taskRoutes = require('./taskRoutes');
const paymentRoutes = require('./paymentRoutes');
const proofRoutes = require('./proofRoutes');
const messageRoutes = require('./messageRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Définition des routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/responsable', responsableRoutes);
router.use('/employer', employerRoutes);
router.use('/user', userRoutes);
router.use('/reclamations', reclamationRoutes);
router.use('/tasks', taskRoutes);
router.use('/payments', paymentRoutes);
router.use('/proofs', proofRoutes);
router.use('/messages', messageRoutes);
router.use('/dashboard', dashboardRoutes);

// Route de santé (health check)
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API RMS est opérationnelle',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;