const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    validateTaskProofs
} = require('../controllers/proofController');
const {
    getDashboard,
    getReclamations,
    getReclamationById,
    updateReclamationStatus,
    createEmployee,
    createEmployeesBulk,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deactivateEmployee,
    activateEmployee,
    deleteEmployee,
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    validateTask,
    distributePayment,
    getPaymentHistory
} = require('../controllers/responsableController');

// Toutes les routes responsable nécessitent authentification et rôle responsable
router.use(protect);
router.use(authorize('responsable'));

// Dashboard
router.get('/dashboard', getDashboard);

// Routes Réclamations
router.get('/reclamations', getReclamations);
router.get('/reclamations/:id', getReclamationById);
router.put('/reclamations/:id/status', updateReclamationStatus);

// Routes Employés
router.post('/employees', createEmployee);
router.post('/employees/bulk', createEmployeesBulk);
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);
router.put('/employees/:id', updateEmployee);
router.put('/employees/:id/deactivate', deactivateEmployee);
router.put('/employees/:id/activate', activateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Routes Tâches
router.post('/tasks', createTask);
router.get('/tasks', getTasks);
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', updateTask);
router.put('/tasks/:id/validate', validateTask);

// Routes Paiements (privé/association uniquement)
router.post('/payments/distribute', distributePayment);
router.get('/payments/history', getPaymentHistory);
router.put('/tasks/:id/proofs/validate', validateTaskProofs);

module.exports = router;