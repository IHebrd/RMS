const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../services/emailService');
const Admin = require('../models/Admin');
const Responsable = require('../models/Responsable');
const Employer = require('../models/Employer');
const User = require('../models/User');

// Génération du token JWT
const generateToken = (id, table, role) => {
    return jwt.sign(
        { id, table, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Vérifier quel type d'utilisateur et retourner ses infos
const findUserByEmail = async (email) => {
    let user = await Admin.findByEmail(email);
    if (user) return { user, table: 'admin', role: 'admin' };
    
    user = await Responsable.findByEmail(email);
    if (user) return { user, table: 'responsable', role: 'responsable' };
    
    user = await Employer.findByEmail(email);
    if (user) return { user, table: 'employer', role: 'employer' };
    
    user = await User.findByEmail(email);
    if (user) return { user, table: 'user', role: 'user' };
    
    return null;
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Email et mot de passe requis'
                }
            });
        }
        
        const userData = await findUserByEmail(email);
        
        if (!userData) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email ou mot de passe incorrect'
                }
            });
        }
        
        const { user, table, role } = userData;
        
        // Vérifier si le compte est actif
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'ACCOUNT_INACTIVE',
                    message: 'Votre compte est désactivé. Veuillez contacter l\'administrateur.'
                }
            });
        }
        
        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Email ou mot de passe incorrect'
                }
            });
        }
        
        // Mettre à jour la dernière connexion
        const updateData = { last_login: new Date() };
        if (table === 'admin') await Admin.update(user.id, updateData);
        else if (table === 'responsable') await Responsable.update(user.id, updateData);
        else if (table === 'employer') await Employer.update(user.id, updateData);
        else await User.update(user.id, updateData);
        
        // Générer le token
        const token = generateToken(user.id, table, role);
        
        // Préparer la réponse utilisateur (sans mot de passe)
        const userResponse = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            avatar: user.avatar,
            role: role,
            is_active: user.is_active
        };
        
        // Ajouter des informations spécifiques au rôle
        if (table === 'responsable') {
            userResponse.organization_id = user.organization_id;
            userResponse.position = user.position;
        } else if (table === 'employer') {
            userResponse.organization_id = user.organization_id;
            userResponse.balance = user.balance;
            userResponse.skills = user.skills;
        } else if (table === 'user') {
            userResponse.governorate = user.governorate;
        }
        
        res.status(200).json({
            success: true,
            data: {
                token,
                user: userResponse
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de la connexion'
            }
        });
    }
};

// @desc    Inscription utilisateur (client)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { email, password, confirm_password, first_name, last_name, phone, cin, address, governorate } = req.body;
        
        // Validation des champs requis
        if (!email || !password || !confirm_password || !first_name || !last_name) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Tous les champs obligatoires doivent être remplis'
                }
            });
        }
        
        // Vérifier que les mots de passe correspondent
        if (password !== confirm_password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PASSWORD_MISMATCH',
                    message: 'Les mots de passe ne correspondent pas'
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
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'EMAIL_EXISTS',
                    message: 'Un compte avec cet email existe déjà'
                }
            });
        }
        
        // Vérifier le CIN s'il est fourni
        if (cin) {
            const existingCin = await User.findByCin(cin);
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
        
        // Créer l'utilisateur
        const newUser = await User.create({
            email,
            password_hash,
            first_name,
            last_name,
            phone: phone || null,
            cin: cin || null,
            address: address || null,
            governorate: governorate || null
        });
        
        // Générer le token
        const token = generateToken(newUser.id, 'user', 'user');
        
        // Envoyer email de bienvenue (fire-and-forget)
        try {
            await sendEmail(
                email,
                'Bienvenue sur RMS',
                emailTemplates.welcome(first_name, last_name),
                'user',
                newUser.id,
                'welcome'
            );
        } catch (emailErr) {
            console.error('Welcome email failed:', emailErr.message);
        }
        
        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès',
            data: {
                token,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    first_name: newUser.first_name,
                    last_name: newUser.last_name,
                    phone: newUser.phone,
                    avatar: newUser.avatar,
                    role: 'user'
                }
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors de l\'inscription'
            }
        });
    }
};

// @desc    Déconnexion
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    // Le logout est géré côté client en supprimant le token
    res.status(200).json({
        success: true,
        message: 'Déconnecté avec succès'
    });
};

// @desc    Rafraîchir le token JWT
// @route   POST /api/auth/refresh-token
// @access  Private
const refreshToken = async (req, res) => {
    try {
        const { user, userTable, userRole, userId } = req;
        
        const newToken = generateToken(userId, userTable, userRole);
        
        res.status(200).json({
            success: true,
            data: { token: newToken }
        });
        
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors du rafraîchissement du token'
            }
        });
    }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password, confirm_password } = req.body;
        const { user, userTable, userId } = req;
        
        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Tous les champs sont requis'
                }
            });
        }
        
        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PASSWORD_MISMATCH',
                    message: 'Les nouveaux mots de passe ne correspondent pas'
                }
            });
        }
        
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'WEAK_PASSWORD',
                    message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
                }
            });
        }
        
        // Vérifier l'ancien mot de passe
        const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: 'Mot de passe actuel incorrect'
                }
            });
        }
        
        // Hasher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(new_password, salt);
        
        // Mettre à jour le mot de passe
        if (userTable === 'admin') await Admin.update(userId, { password_hash: newPasswordHash });
        else if (userTable === 'responsable') await Responsable.update(userId, { password_hash: newPasswordHash });
        else if (userTable === 'employer') await Employer.update(userId, { password_hash: newPasswordHash });
        else await User.update(userId, { password_hash: newPasswordHash });
        
        res.status(200).json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Erreur lors du changement de mot de passe'
            }
        });
    }
};

module.exports = {
    login,
    register,
    logout,
    refreshToken,
    changePassword
};