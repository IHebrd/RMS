const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAllProofs,
    getProofById,
    deleteProof,
    getProofsByTask,
    getProofStats
} = require('../controllers/proofController');

// Routes publiques (stats)
router.get('/stats', getProofStats);

// Routes protégées (admin uniquement)
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllProofs);
router.get('/:id', getProofById);
router.get('/task/:taskId', getProofsByTask);
router.delete('/:id', deleteProof);

module.exports = router;