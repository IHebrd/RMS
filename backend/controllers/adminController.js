const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Responsable = require('../models/Responsable');
const Employer = require('../models/Employer');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { sendEmail, emailTemplates } = require('../services/emailService');

// ==================== GESTION DES ORGANISATIONS ====================

// @desc    Créer une organisation
// @route   POST /api/admin/organizations
// @access  Private (Admin only)
const createOrganization = async (req, res) => {
    try {
        const { name, type, description, logo, governorate, delegation, postal_code, address, phone, email, website } = req.body;
        
        if (!name || !type || !governorate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Nom, type et gouvernorat sont requis'
                }
            });
        }
        
        if (!['public', 'private', 'association'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TYPE',
                    message: 'Type invalide. Types acceptés: public, private, association'
                }
            });
        }
        
        const newOrganization = await Organization.create({
            name, type, description, logo, governorate, delegation, postal_code, address, phone, email, website
        });
        
        res.status(201).json({
            success: true,
            message: 'Organisation créée avec succès',
            data: newOrganization
        });
        
    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la création de l\'organisation'
            }
        });
    }
};

// @desc    Liste des organisations
// @route   GET /api/admin/organizations
// @access  Private (Admin only)
const getOrganizations = async (req, res) => {
    try {
        const { type, governorate, is_active, search, page = 1, limit = 20 } = req.query;
        
        const filters = {
            type,
            governorate,
            is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
            search,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const organizations = await Organization.findAll(filters);
        const total = await Organization.count(filters);
        
        res.status(200).json({
            success: true,
            data: {
                organizations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des organisations'
            }
        });
    }
};

// @desc    Détail d'une organisation
// @route   GET /api/admin/organizations/:id
// @access  Private (Admin only)
const getOrganizationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const organization = await Organization.findById(id);
        if (!organization) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Organisation non trouvée'
                }
            });
        }
        
        const stats = await Organization.getStats(id);
        
        res.status(200).json({
            success: true,
            data: {
                ...organization,
                stats
            }
        });
        
    } catch (error) {
        console.error('Get organization by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de l\'organisation'
            }
        });
    }
};

// @desc    Modifier une organisation
// @route   PUT /api/admin/organizations/:id
// @access  Private (Admin only)
const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingOrg = await Organization.findById(id);
        if (!existingOrg) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Organisation non trouvée'
                }
            });
        }
        
        const updatedOrg = await Organization.update(id, req.body);
        
        res.status(200).json({
            success: true,
            message: 'Organisation mise à jour',
            data: updatedOrg
        });
        
    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la mise à jour de l\'organisation'
            }
        });
    }
};

// @desc    Supprimer une organisation
// @route   DELETE /api/admin/organizations/:id
// @access  Private (Admin only)
const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existingOrg = await Organization.findById(id);
        if (!existingOrg) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Organisation non trouvée'
                }
            });
        }
        
        await Organization.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Organisation supprimée avec succès'
        });
        
    } catch (error) {
        console.error('Delete organization error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de l\'organisation'
            }
        });
    }
};

// ==================== GESTION DES RESPONSABLES ====================

// @desc    Créer un responsable
// @route   POST /api/admin/responsables
// @access  Private (Admin only)
const createResponsable = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, cin, organization_id, position } = req.body;
        
        if (!email || !password || !first_name || !last_name || !organization_id) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email, mot de passe, nom, prénom et organisation sont requis'
                }
            });
        }
        
        // Vérifier si l'organisation existe
        const organization = await Organization.findById(organization_id);
        if (!organization) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ORGANIZATION_NOT_FOUND',
                    message: 'Organisation non trouvée'
                }
            });
        }
        
        // Vérifier si l'email existe déjà
        const existingUser = await Responsable.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'Cet email est déjà utilisé'
                }
            });
        }
        
        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const newResponsable = await Responsable.create({
            email, password_hash, first_name, last_name, phone, cin, organization_id, position
        });
        
        // Envoyer email de création de compte
        await sendEmail(
            email,
            'Votre compte responsable RMS',
            emailTemplates.accountCreated(first_name, last_name, email, password, 'responsable'),
            'responsable',
            newResponsable.id,
            'account_created'
        );
        
        res.status(201).json({
            success: true,
            message: 'Responsable créé avec succès',
            data: newResponsable
        });
        
    } catch (error) {
        console.error('Create responsable error:', error);
        if (error.code === '23505') {
            const field = error.constraint?.includes('cin') ? 'CIN' : error.constraint?.includes('email') ? 'email' : 'champ';
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_FIELD',
                    message: `Ce ${field} est déjà utilisé`
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la création du responsable'
            }
        });
    }
};

// @desc    Liste des responsables
// @route   GET /api/admin/responsables
// @access  Private (Admin only)
const getResponsables = async (req, res) => {
    try {
        const { organization_id, is_active, search, page = 1, limit = 20 } = req.query;
        
        const filters = {
            organization_id,
            is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
            search,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const responsables = await Responsable.findAll(filters);
        const total = await Responsable.count(filters);
        
        res.status(200).json({
            success: true,
            data: {
                responsables,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get responsables error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des responsables'
            }
        });
    }
};

// @desc    Modifier un responsable
// @route   PUT /api/admin/responsables/:id
// @access  Private (Admin only)
const updateResponsable = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = await Responsable.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Responsable non trouvé'
                }
            });
        }
        
        const updated = await Responsable.update(id, req.body);
        
        res.status(200).json({
            success: true,
            message: 'Responsable mis à jour',
            data: updated
        });
        
    } catch (error) {
        console.error('Update responsable error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la mise à jour du responsable'
            }
        });
    }
};

// @desc    Supprimer un responsable
// @route   DELETE /api/admin/responsables/:id
// @access  Private (Admin only)
const deleteResponsable = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = await Responsable.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Responsable non trouvé'
                }
            });
        }
        
        await Responsable.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Responsable supprimé avec succès'
        });
        
    } catch (error) {
        console.error('Delete responsable error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression du responsable'
            }
        });
    }
};

// ==================== GESTION DES ADMINS ====================

// @desc    Créer un administrateur
// @route   POST /api/admin/admins
// @access  Private (Admin only)
const createAdmin = async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, cin } = req.body;
        
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email, mot de passe, nom et prénom sont requis'
                }
            });
        }
        
        const existing = await Admin.findByEmail(email);
        if (existing) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'Cet email est déjà utilisé'
                }
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const newAdmin = await Admin.create({
            email, password_hash, first_name, last_name, phone, cin
        });
        
        res.status(201).json({
            success: true,
            message: 'Administrateur créé avec succès',
            data: newAdmin
        });
        
    } catch (error) {
        console.error('Create admin error:', error);
        if (error.code === '23505') {
            const field = error.constraint?.includes('cin') ? 'CIN' : error.constraint?.includes('email') ? 'email' : 'champ';
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_FIELD',
                    message: `Ce ${field} est déjà utilisé`
                }
            });
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la création de l\'administrateur'
            }
        });
    }
};

// @desc    Liste des administrateurs
// @route   GET /api/admin/admins
// @access  Private (Admin only)
const getAdmins = async (req, res) => {
    try {
        const { is_active, search } = req.query;
        
        const filters = {
            is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
            search
        };
        
        const admins = await Admin.findAll(filters);
        
        res.status(200).json({
            success: true,
            data: { admins }
        });
        
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des administrateurs'
            }
        });
    }
};

// @desc    Modifier un administrateur
// @route   PUT /api/admin/admins/:id
// @access  Private (Admin only)
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = await Admin.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Administrateur non trouvé'
                }
            });
        }
        
        const updated = await Admin.update(id, req.body);
        
        res.status(200).json({
            success: true,
            message: 'Administrateur mis à jour',
            data: updated
        });
        
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la mise à jour de l\'administrateur'
            }
        });
    }
};

// @desc    Supprimer un administrateur
// @route   DELETE /api/admin/admins/:id
// @access  Private (Admin only)
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (parseInt(id) === req.userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'CANNOT_DELETE_SELF',
                    message: 'Vous ne pouvez pas supprimer votre propre compte'
                }
            });
        }
        
        const existing = await Admin.findById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Administrateur non trouvé'
                }
            });
        }
        
        await Admin.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Administrateur supprimé avec succès'
        });
        
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de l\'administrateur'
            }
        });
    }
};

module.exports = {
    // Organizations
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
};