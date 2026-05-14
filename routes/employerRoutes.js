const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware'); // Notez les accolades !
const {
    // ... autres imports
    uploadTaskProofs,
    deleteEmployerProof
} = require('../controllers/proofController');

const {
    getDashboard,
    getTasks,
    getTaskById,
    startTask,
    completeTask,
    failTask,
    getBalance,
    getProfile,
    updateProfile,
    uploadAvatar,
    sendMessage,
    getMessages
} = require('../controllers/employerController');

// Toutes les routes employé nécessitent authentification et rôle employer
router.use(protect);
router.use(authorize('employer'));

// Dashboard
router.get('/dashboard', getDashboard);

// Routes Profil
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), uploadAvatar);

// Routes Tâches
router.get('/tasks', getTasks);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id/start', startTask);
router.put('/tasks/:id/complete', completeTask);
router.put('/tasks/:id/fail', failTask);

// Routes Preuves
router.post('/tasks/:id/proofs', upload.array('proofs', 10), uploadTaskProofs);
router.delete('/proofs/:id', deleteEmployerProof);

// Routes Solde
router.get('/balance', getBalance);

// Routes Messages
router.post('/tasks/:id/messages', sendMessage);
router.get('/tasks/:id/messages', getMessages);
module.exports = router;