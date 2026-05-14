const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    // Organisations
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    // Responsables
    createResponsable,
    getResponsables,
    updateResponsable,
    deleteResponsable,
    // Admins
    createAdmin,
    getAdmins,
    updateAdmin,
    deleteAdmin
} = require('../controllers/adminController');

// Toutes les routes admin nécessitent authentification et rôle admin
router.use(protect);
router.use(authorize('admin'));

// Routes Organisations
router.post('/organizations', createOrganization);
router.get('/organizations', getOrganizations);
router.get('/organizations/:id', getOrganizationById);
router.put('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);

// Routes Responsables
router.post('/responsables', createResponsable);
router.get('/responsables', getResponsables);
router.put('/responsables/:id', updateResponsable);
router.delete('/responsables/:id', deleteResponsable);

// Routes Admins
router.post('/admins', createAdmin);
router.get('/admins', getAdmins);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

module.exports = router;