const db = require('../config/database');
const bcrypt = require('bcryptjs');
const Employer = require('../models/Employer');
const Reclamation = require('../models/Reclamation');
const ReclamationOrganization = require('../models/ReclamationOrganization');
const Task = require('../models/Task');
const Proof = require('../models/Proof');
const PaymentDistribution = require('../models/PaymentDistribution');
const PaymentItem = require('../models/PaymentItem');
const StatusHistory = require('../models/StatusHistory');
const { sendEmail, emailTemplates } = require('../services/emailService');

// ==================== TABLEAU DE BORD ====================

// @desc    Dashboard responsable
// @route   GET /api/responsable/dashboard
// @access  Private (Responsable only)
const getDashboard = async (req, res) => {
    try {
        const responsableId = req.userId;
        const organizationId = req.user.organization_id;
        
        // Statistiques des réclamations
        const reclamationsStats = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
             FROM reclamation_organizations
             WHERE organization_id = $1`,
            [organizationId]
        );
        
        // Statistiques des employés
        const employeesStats = await db.query(
            `SELECT 
                COUNT(*) as total_employees,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_employees
             FROM employer
             WHERE organization_id = $1`,
            [organizationId]
        );
        
        // Statistiques des tâches
        const tasksStats = await db.query(
            `SELECT 
                COUNT(*) as total_tasks,
                COUNT(CASE WHEN t.status = 'assigned' THEN 1 END) as assigned,
                COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed
             FROM tasks t
             JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
             WHERE ro.organization_id = $1`,
            [organizationId]
        );
        
        // Dernières réclamations
        const recentReclamations = await ReclamationOrganization.findAll({
            organization_id: organizationId,
            limit: 5
        });
        
        // Employés avec leurs tâches
        const employees = await Employer.findByOrganization(organizationId);
        
        res.status(200).json({
            success: true,
            data: {
                organization: {
                    id: organizationId,
                    name: req.user.organization_name,
                    type: req.user.organization_type
                },
                stats: {
                    reclamations: reclamationsStats.rows[0],
                    employees: employeesStats.rows[0],
                    tasks: tasksStats.rows[0]
                },
                recent_reclamations: recentReclamations,
                employees: employees
            }
        });
        
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération du tableau de bord'
            }
        });
    }
};

// ==================== GESTION DES RÉCLAMATIONS ====================

// @desc    Liste des réclamations de l'organisation
// @route   GET /api/responsable/reclamations
// @access  Private (Responsable only)
const getReclamations = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { status, type, urgency, page = 1, limit = 20 } = req.query;
        
        const reclamations = await Reclamation.findByOrganization(organizationId, {
            status,
            type,
            urgency,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });
        
        const total = await db.query(
            `SELECT COUNT(*) 
             FROM reclamation_organizations ro
             JOIN reclamations r ON ro.reclamation_id = r.id
             WHERE ro.organization_id = $1`,
            [organizationId]
        );
        
        res.status(200).json({
            success: true,
            data: {
                reclamations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(total.rows[0].count),
                    pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get reclamations error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des réclamations'
            }
        });
    }
};

// @desc    Détail d'une réclamation
// @route   GET /api/responsable/reclamations/:id
// @access  Private (Responsable only)
const getReclamationById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organization_id;
        
        const reclamationOrg = await ReclamationOrganization.getWithDetails(id);
        
        if (!reclamationOrg) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Réclamation non trouvée'
                }
            });
        }
        
        if (reclamationOrg.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: reclamationOrg
        });
        
    } catch (error) {
        console.error('Get reclamation by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de la réclamation'
            }
        });
    }
};

// @desc    Changer le statut d'une réclamation
// @route   PUT /api/responsable/reclamations/:id/status
// @access  Private (Responsable only)
const updateReclamationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const organizationId = req.user.organization_id;
        const responsableId = req.userId;
        
        const reclamationOrg = await ReclamationOrganization.findById(id);
        
        if (!reclamationOrg) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Réclamation non trouvée'
                }
            });
        }
        
        if (reclamationOrg.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        const oldStatus = reclamationOrg.status;
        const updated = await ReclamationOrganization.updateStatus(id, status, notes);
        
        // Enregistrer dans l'historique
        await StatusHistory.create({
            reclamation_org_id: parseInt(id),
            old_status: oldStatus,
            new_status: status,
            changed_by_type: 'responsable',
            changed_by_id: responsableId,
            comment: notes
        });
        
        // Vérifier si toutes les organisations ont validé pour mettre à jour le statut principal
        if (status === 'validated') {
            const allOrgs = await ReclamationOrganization.findByReclamation(reclamationOrg.reclamation_id);
            const allValidated = allOrgs.every(org => org.status === 'validated');
            
            if (allValidated) {
                await Reclamation.updateStatus(reclamationOrg.reclamation_id, 'validated');
            }
        }
        
        // Notifier l'utilisateur par email (fire-and-forget)
        try {
            const reclamation = await Reclamation.findById(reclamationOrg.reclamation_id);
            if (reclamation && reclamation.email) {
                await sendEmail(
                    reclamation.email,
                    `Mise à jour de votre réclamation ${reclamation.reference}`,
                    emailTemplates.reclamationStatusChanged(reclamation.first_name, reclamation.reference, status),
                    'user',
                    reclamation.user_id,
                    'status_change',
                    reclamationOrg.reclamation_id
                );
            }
        } catch (emailErr) {
            console.error('Email notification failed (status change):', emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Statut mis à jour',
            data: updated
        });
        
    } catch (error) {
        console.error('Update reclamation status error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la mise à jour du statut'
            }
        });
    }
};

// ==================== GESTION DES EMPLOYÉS ====================

// @desc    Créer un employé dans l'organisation
// @route   POST /api/responsable/employees
// @access  Private (Responsable only)
const createEmployee = async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            phone,
            cin,
            skills = []
        } = req.body;
        
        const organizationId = req.user.organization_id;
        
        // Validation des champs requis
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email, mot de passe, nom et prénom sont requis'
                }
            });
        }
        
        // Vérifier la longueur du mot de passe
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'WEAK_PASSWORD',
                    message: 'Le mot de passe doit contenir au moins 6 caractères'
                }
            });
        }
        
        // Vérifier si l'email existe déjà
        const existingEmployer = await Employer.findByEmail(email);
        if (existingEmployer) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'Cet email est déjà utilisé'
                }
            });
        }
        
        // Vérifier le CIN s'il est fourni
        if (cin) {
            const existingCin = await Employer.findByCin(cin);
            if (existingCin) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'CIN_EXISTS',
                        message: 'Ce numéro CIN est déjà utilisé'
                    }
                });
            }
        }
        
        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        // Créer l'employé
        const newEmployee = await Employer.create({
            email,
            password_hash,
            first_name,
            last_name,
            phone: phone || null,
            cin: cin || null,
            organization_id: organizationId,
            balance: 0,
            skills: skills || []
        });
        
        // Envoyer email de création de compte (fire-and-forget)
        try {
            await sendEmail(
                email,
                'Votre compte employé RMS',
                emailTemplates.accountCreated(first_name, last_name, email, password, 'employer'),
                'employer',
                newEmployee.id,
                'account_created'
            );
        } catch (emailErr) {
            console.error('Email notification failed (employee created):', emailErr.message);
        }
        
        res.status(201).json({
            success: true,
            message: 'Employé créé avec succès',
            data: {
                id: newEmployee.id,
                email: newEmployee.email,
                first_name: newEmployee.first_name,
                last_name: newEmployee.last_name,
                phone: newEmployee.phone,
                cin: newEmployee.cin,
                skills: newEmployee.skills,
                balance: newEmployee.balance,
                is_active: newEmployee.is_active,
                created_at: newEmployee.created_at
            }
        });
        
    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la création de l\'employé'
            }
        });
    }
};

// @desc    Créer plusieurs employés en masse
// @route   POST /api/responsable/employees/bulk
// @access  Private (Responsable only)
const createEmployeesBulk = async (req, res) => {
    try {
        const { employees } = req.body;
        const organizationId = req.user.organization_id;
        
        if (!employees || !Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_EMPLOYEES',
                    message: 'La liste des employés est requise'
                }
            });
        }
        
        const results = {
            created: [],
            failed: []
        };
        
        for (const emp of employees) {
            try {
                const { email, password, first_name, last_name, phone, cin, skills = [] } = emp;
                
                // Validation
                if (!email || !password || !first_name || !last_name) {
                    results.failed.push({ email, reason: 'Champs requis manquants' });
                    continue;
                }
                
                if (password.length < 6) {
                    results.failed.push({ email, reason: 'Mot de passe trop court (min 6 caractères)' });
                    continue;
                }
                
                // Vérifier si l'email existe déjà
                const existingEmployer = await Employer.findByEmail(email);
                if (existingEmployer) {
                    results.failed.push({ email, reason: 'Email déjà utilisé' });
                    continue;
                }
                
                // Hasher le mot de passe
                const salt = await bcrypt.genSalt(10);
                const password_hash = await bcrypt.hash(password, salt);
                
                // Créer l'employé
                const newEmployee = await Employer.create({
                    email,
                    password_hash,
                    first_name,
                    last_name,
                    phone: phone || null,
                    cin: cin || null,
                    organization_id: organizationId,
                    balance: 0,
                    skills: skills || []
                });
                
                // Envoyer email (fire-and-forget)
                try {
                    await sendEmail(
                        email,
                        'Votre compte employé RMS',
                        emailTemplates.accountCreated(first_name, last_name, email, password, 'employer'),
                        'employer',
                        newEmployee.id,
                        'account_created'
                    );
                } catch (emailErr) {
                    console.error('Email notification failed (bulk employee):', emailErr.message);
                }
                
                results.created.push({
                    id: newEmployee.id,
                    email: newEmployee.email,
                    first_name: newEmployee.first_name,
                    last_name: newEmployee.last_name
                });
                
            } catch (err) {
                results.failed.push({ email: emp.email, reason: err.message });
            }
        }
        
        res.status(201).json({
            success: true,
            message: `${results.created.length} employé(s) créé(s), ${results.failed.length} échec(s)`,
            data: results
        });
        
    } catch (error) {
        console.error('Bulk create employees error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la création massive des employés'
            }
        });
    }
};

// @desc    Liste des employés
// @route   GET /api/responsable/employees
// @access  Private (Responsable only)
const getEmployees = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { is_active, search, page = 1, limit = 20 } = req.query;
        
        const filters = {
            organization_id: organizationId,
            is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
            search,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        };
        
        const employees = await Employer.findAll(filters);
        const total = await Employer.count({ organization_id: organizationId });
        
        res.status(200).json({
            success: true,
            data: {
                employees,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des employés'
            }
        });
    }
};

// @desc    Détail d'un employé
// @route   GET /api/responsable/employees/:id
// @access  Private (Responsable only)
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organization_id;
        
        const employee = await Employer.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Employé non trouvé'
                }
            });
        }
        
        if (employee.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cet employé'
                }
            });
        }
        
        const stats = await Employer.getStats(id);
        const tasks = await Task.findByEmployer(id, { limit: 10 });
        
        // Supprimer le mot de passe
        delete employee.password_hash;
        
        res.status(200).json({
            success: true,
            data: {
                ...employee,
                stats,
                recent_tasks: tasks
            }
        });
        
    } catch (error) {
        console.error('Get employee by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de l\'employé'
            }
        });
    }
};

// @desc    Modifier un employé
// @route   PUT /api/responsable/employees/:id
// @access  Private (Responsable only)
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { phone, skills, is_active } = req.body;
        const organizationId = req.user.organization_id;
        
        // Vérifier que l'employé appartient à l'organisation
        const employee = await Employer.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Employé non trouvé'
                }
            });
        }
        
        if (employee.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cet employé'
                }
            });
        }
        
        const updateData = {};
        if (phone !== undefined) updateData.phone = phone;
        if (skills !== undefined) updateData.skills = skills;
        if (is_active !== undefined) updateData.is_active = is_active;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'NO_DATA',
                    message: 'Aucune donnée à mettre à jour'
                }
            });
        }
        
        const updated = await Employer.update(id, updateData);
        
        delete updated.password_hash;
        
        res.status(200).json({
            success: true,
            message: 'Employé mis à jour',
            data: updated
        });
        
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la mise à jour de l\'employé'
            }
        });
    }
};

// @desc    Désactiver un employé
// @route   PUT /api/responsable/employees/:id/deactivate
// @access  Private (Responsable only)
const deactivateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organization_id;
        
        const employee = await Employer.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Employé non trouvé'
                }
            });
        }
        
        if (employee.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cet employé'
                }
            });
        }
        
        const updated = await Employer.update(id, { is_active: false });
        
        res.status(200).json({
            success: true,
            message: 'Employé désactivé',
            data: { id: updated.id, is_active: updated.is_active }
        });
        
    } catch (error) {
        console.error('Deactivate employee error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la désactivation de l\'employé'
            }
        });
    }
};

// @desc    Activer un employé
// @route   PUT /api/responsable/employees/:id/activate
// @access  Private (Responsable only)
const activateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organization_id;
        
        const employee = await Employer.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Employé non trouvé'
                }
            });
        }
        
        if (employee.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cet employé'
                }
            });
        }
        
        const updated = await Employer.update(id, { is_active: true });
        
        res.status(200).json({
            success: true,
            message: 'Employé activé',
            data: { id: updated.id, is_active: updated.is_active }
        });
        
    } catch (error) {
        console.error('Activate employee error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de l\'activation de l\'employé'
            }
        });
    }
};

// @desc    Supprimer un employé
// @route   DELETE /api/responsable/employees/:id
// @access  Private (Responsable only)
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organization_id;
        
        const employee = await Employer.findById(id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Employé non trouvé'
                }
            });
        }
        
        if (employee.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cet employé'
                }
            });
        }
        
        await Employer.delete(id);
        
        res.status(200).json({
            success: true,
            message: 'Employé supprimé avec succès'
        });
        
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la suppression de l\'employé'
            }
        });
    }
};

// ==================== GESTION DES TÂCHES ====================

// @desc    Créer une tâche
// @route   POST /api/responsable/tasks
// @access  Private (Responsable only)
const createTask = async (req, res) => {
    try {
        const { reclamation_org_id, employer_ids, description, scheduled_date, payment_amounts } = req.body;
        const organizationId = req.user.organization_id;
        const responsableId = req.userId;
        
        // Vérifier que la réclamation appartient à l'organisation
        const reclamationOrg = await ReclamationOrganization.findById(reclamation_org_id);
        if (!reclamationOrg) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Réclamation non trouvée'
                }
            });
        }
        
        if (reclamationOrg.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        // Créer les tâches
        const tasksData = employer_ids.map((employerId, index) => ({
            employer_id: employerId,
            description,
            scheduled_date,
            payment_amount: payment_amounts ? payment_amounts[index] : 0
        }));
        
        const tasks = await Task.createMultiple(reclamation_org_id, tasksData);
        
        // Envoyer des emails aux employés (fire-and-forget)
        for (const task of tasks) {
            try {
                const employer = await Employer.findById(task.employer_id);
                if (employer && employer.email) {
                    await sendEmail(
                        employer.email,
                        'Nouvelle tâche assignée',
                        emailTemplates.taskAssigned(employer.first_name, task.description),
                        'employer',
                        employer.id,
                        'task_assigned',
                        null,
                        task.id
                    );
                }
            } catch (emailErr) {
                console.error('Email notification failed (task assigned):', emailErr.message);
            }
        }
        
        // Mettre à jour le statut de la réclamation
        if (reclamationOrg.status === 'pending') {
            await ReclamationOrganization.updateStatus(reclamation_org_id, 'in_progress');
            await StatusHistory.create({
                reclamation_org_id: reclamation_org_id,
                old_status: 'pending',
                new_status: 'in_progress',
                changed_by_type: 'responsable',
                changed_by_id: responsableId,
                comment: 'Tâches assignées'
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Tâche(s) créée(s) avec succès',
            data: { tasks }
        });
        
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la création de la tâche'
            }
        });
    }
};

// @desc    Liste des tâches
// @route   GET /api/responsable/tasks
// @access  Private (Responsable only)
const getTasks = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        const { status, employer_id, reclamation_id, page = 1, limit = 20 } = req.query;
        
        let query = `
            SELECT t.id, t.description, t.status, t.payment_amount, t.scheduled_date, t.completed_at, t.created_at,
                   e.id as employer_id, e.first_name, e.last_name,
                   r.reference, r.title,
                   ro.id as reclamation_org_id
            FROM tasks t
            JOIN employer e ON t.employer_id = e.id
            JOIN reclamation_organizations ro ON t.reclamation_org_id = ro.id
            JOIN reclamations r ON ro.reclamation_id = r.id
            WHERE e.organization_id = $1
        `;
        const values = [organizationId];
        let idx = 2;
        
        if (status) {
            query += ` AND t.status = $${idx++}`;
            values.push(status);
        }
        if (employer_id) {
            query += ` AND t.employer_id = $${idx++}`;
            values.push(employer_id);
        }
        if (reclamation_id) {
            query += ` AND r.id = $${idx++}`;
            values.push(reclamation_id);
        }
        
        query += ` ORDER BY t.scheduled_date ASC NULLS LAST, t.created_at DESC`;
        
        if (limit) {
            query += ` LIMIT $${idx++}`;
            values.push(parseInt(limit));
            query += ` OFFSET $${idx++}`;
            values.push((parseInt(page) - 1) * parseInt(limit));
        }
        
        const result = await db.query(query, values);
        
        const countResult = await db.query(
            `SELECT COUNT(*) 
             FROM tasks t
             JOIN employer e ON t.employer_id = e.id
             WHERE e.organization_id = $1`,
            [organizationId]
        );
        
        res.status(200).json({
            success: true,
            data: {
                tasks: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count),
                    pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
                }
            }
        });
        
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération des tâches'
            }
        });
    }
};

// @desc    Détail d'une tâche
// @route   GET /api/responsable/tasks/:id
// @access  Private (Responsable only)
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user.organization_id;
        
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        const employer = await Employer.findById(task.employer_id);
        if (employer.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette tâche'
                }
            });
        }
        
        const proofs = await Proof.findByTask(id);
        
        res.status(200).json({
            success: true,
            data: {
                ...task,
                proofs
            }
        });
        
    } catch (error) {
        console.error('Get task by id error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de la tâche'
            }
        });
    }
};

// @desc    Modifier une tâche
// @route   PUT /api/responsable/tasks/:id
// @access  Private (Responsable only)
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, scheduled_date, employer_id } = req.body;
        const organizationId = req.user.organization_id;
        
        // Vérifier que la tâche appartient à l'organisation
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        const employer = await Employer.findById(task.employer_id);
        if (employer.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette tâche'
                }
            });
        }
        
        const updated = await Task.update(id, { description, scheduled_date, employer_id });
        
        res.status(200).json({
            success: true,
            message: 'Tâche modifiée',
            data: updated
        });
        
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la modification de la tâche'
            }
        });
    }
};

// @desc    Valider une tâche
// @route   PUT /api/responsable/tasks/:id/validate
// @access  Private (Responsable only)
const validateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;
        const organizationId = req.user.organization_id;
        const responsableId = req.userId;
        
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tâche non trouvée'
                }
            });
        }
        
        const employer = await Employer.findById(task.employer_id);
        if (employer.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette tâche'
                }
            });
        }
        
        const oldStatus = task.status;
        const completedAt = status === 'completed' ? new Date() : null;
        const updated = await Task.updateStatus(id, status, completedAt);
        
        // Enregistrer dans l'historique
        await StatusHistory.create({
            task_id: parseInt(id),
            old_status: oldStatus,
            new_status: status,
            changed_by_type: 'responsable',
            changed_by_id: responsableId,
            comment: comment
        });
        
        // Vérifier si toutes les tâches de la réclamation sont terminées
        const allTasks = await Task.findByReclamationOrg(task.reclamation_org_id);
        const allCompleted = allTasks.every(t => t.status === 'completed');
        
        if (allCompleted) {
            await ReclamationOrganization.updateStatus(task.reclamation_org_id, 'validated');
            await StatusHistory.create({
                reclamation_org_id: task.reclamation_org_id,
                old_status: 'in_progress',
                new_status: 'validated',
                changed_by_type: 'responsable',
                changed_by_id: responsableId,
                comment: 'Toutes les tâches sont terminées'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Tâche validée',
            data: updated
        });
        
    } catch (error) {
        console.error('Validate task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la validation de la tâche'
            }
        });
    }
};

// ==================== GESTION DES PAIEMENTS ====================

// @desc    Distribuer un paiement
// @route   POST /api/responsable/payments/distribute
// @access  Private (Responsable only) - Uniquement pour organisations privées/associations
const distributePayment = async (req, res) => {
    try {
        const { reclamation_org_id, distributions } = req.body;
        const organizationId = req.user.organization_id;
        const responsableId = req.userId;
        
        // Vérifier le type d'organisation
        if (req.user.organization_type === 'public') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'PAYMENT_NOT_ALLOWED',
                    message: 'Les organisations publiques ne peuvent pas gérer de paiements'
                }
            });
        }
        
        // Vérifier que la réclamation appartient à l'organisation
        const reclamationOrg = await ReclamationOrganization.findById(reclamation_org_id);
        if (!reclamationOrg) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Réclamation non trouvée'
                }
            });
        }
        
        if (reclamationOrg.organization_id !== organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Vous n\'avez pas accès à cette réclamation'
                }
            });
        }
        
        // Récupérer le montant total de la réclamation
        const reclamation = await Reclamation.findById(reclamationOrg.reclamation_id);
        const totalAmount = parseFloat(reclamation.amount);
        
        // Calculer le montant distribué
        const distributedAmount = distributions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        
        if (Math.abs(distributedAmount - totalAmount) > 0.01) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'AMOUNT_MISMATCH',
                    message: `Le montant distribué (${distributedAmount}) ne correspond pas au montant de la réclamation (${totalAmount})`
                }
            });
        }
        
        // Créer la distribution
        const paymentDistribution = await PaymentDistribution.create({
            reclamation_org_id,
            responsable_id: responsableId,
            total_amount: totalAmount
        });
        
        // Créer les items de paiement
        const paymentItems = [];
        for (const dist of distributions) {
            const item = await PaymentItem.create({
                payment_distribution_id: paymentDistribution.id,
                employer_id: dist.employer_id,
                amount: parseFloat(dist.amount),
                task_id: dist.task_id
            });
            paymentItems.push(item);
            
            // Envoyer email à l'employé (fire-and-forget)
            try {
                const employer = await Employer.findById(dist.employer_id);
                if (employer && employer.email) {
                    await sendEmail(
                        employer.email,
                        'Paiement reçu',
                        emailTemplates.paymentReceived(employer.first_name, dist.amount),
                        'employer',
                        employer.id,
                        'payment_received',
                        null,
                        dist.task_id
                    );
                }
            } catch (emailErr) {
                console.error('Email notification failed (payment):', emailErr.message);
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Paiement distribué avec succès',
            data: {
                distribution_id: paymentDistribution.id,
                total_amount: totalAmount,
                distributed_at: paymentDistribution.distributed_at,
                employees: paymentItems
            }
        });
        
    } catch (error) {
        console.error('Distribute payment error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la distribution du paiement'
            }
        });
    }
};

// @desc    Historique des paiements
// @route   GET /api/responsable/payments/history
// @access  Private (Responsable only)
const getPaymentHistory = async (req, res) => {
    try {
        const organizationId = req.user.organization_id;
        
        const payments = await db.query(
            `SELECT pd.id, pd.total_amount, pd.distributed_at,
                    r.reference, r.title,
                    json_agg(jsonb_build_object('employer_name', e.first_name || ' ' || e.last_name, 'amount', pi.amount)) as employees
             FROM payment_distributions pd
             JOIN reclamation_organizations ro ON pd.reclamation_org_id = ro.id
             JOIN reclamations r ON ro.reclamation_id = r.id
             JOIN payment_items pi ON pd.id = pi.payment_distribution_id
             JOIN employer e ON pi.employer_id = e.id
             WHERE ro.organization_id = $1
             GROUP BY pd.id, r.reference, r.title
             ORDER BY pd.distributed_at DESC`,
            [organizationId]
        );
        
        res.status(200).json({
            success: true,
            data: { payments: payments.rows }
        });
        
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la récupération de l\'historique des paiements'
            }
        });
    }
};

module.exports = {
    // Dashboard
    getDashboard,
    // Réclamations
    getReclamations,
    getReclamationById,
    updateReclamationStatus,
    // Employés (NOUVEAU)
    createEmployee,
    createEmployeesBulk,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deactivateEmployee,
    activateEmployee,
    deleteEmployee,
    // Tâches
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    validateTask,
    // Paiements
    distributePayment,
    getPaymentHistory
};