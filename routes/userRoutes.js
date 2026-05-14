const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware'); // Notez les accolades !
const {
    getAvailableOrganizations,
    getProfile,
    updateProfile,
    uploadAvatar,
    createReclamation,
    getReclamations,
    getReclamationById,
    trackReclamation,
    cancelReclamation,
    sendMessage,
    getMessages
} = require('../controllers/userController');

// Toutes les routes utilisateur nécessitent authentification et rôle user
router.use(protect);
router.use(authorize('user'));

// Routes Organisations
router.get('/organizations', getAvailableOrganizations);

// Routes Profil
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/avatar', upload.single('avatar'), uploadAvatar); // Maintenant ça fonctionne

// Routes Réclamations
router.post('/reclamations', upload.array('proofs', 10), createReclamation);
router.get('/reclamations', getReclamations);
router.get('/reclamations/:id', getReclamationById);
router.get('/reclamations/:id/tracking', trackReclamation);
router.put('/reclamations/:id/cancel', cancelReclamation);

// Routes Messages
router.post('/reclamations/:id/messages', sendMessage);
router.get('/reclamations/:id/messages', getMessages);

module.exports = router;
