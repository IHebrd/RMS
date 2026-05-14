const nodemailer = require('nodemailer');
const EmailNotification = require('../models/EmailNotification');

// Configuration du transporteur email
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Templates d'emails
const emailTemplates = {
    // Email de bienvenue
    welcome: (firstName, lastName) => ({
        subject: 'Bienvenue sur RMS - Reclamation Management System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Bienvenue sur RMS !</h2>
                <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
                <p>Nous sommes ravis de vous accueillir sur la plateforme RMS.</p>
                <p>Vous pouvez dès maintenant :</p>
                <ul>
                    <li>Créer des réclamations</li>
                    <li>Suivre l'avancement de vos demandes</li>
                    <li>Communiquer avec les organisations</li>
                </ul>
                <p>Connectez-vous dès maintenant pour découvrir toutes nos fonctionnalités.</p>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    }),

    // Email de création de compte (pour responsable/employé)
    accountCreated: (firstName, lastName, email, password, role) => ({
        subject: 'Votre compte RMS a été créé',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Création de votre compte ${role === 'responsable' ? 'Responsable' : 'Employé'}</h2>
                <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
                <p>Un compte ${role === 'responsable' ? 'responsable' : 'employé'} a été créé pour vous sur la plateforme RMS.</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> ${password}</p>
                </div>
                <p>Nous vous recommandons de changer votre mot de passe dès votre première connexion.</p>
                <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Se connecter</a>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    }),

    // Email de confirmation de création de réclamation
    reclamationCreated: (firstName, reference, title) => ({
        subject: `Confirmation de votre réclamation ${reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Réclamation enregistrée</h2>
                <p>Bonjour <strong>${firstName}</strong>,</p>
                <p>Votre réclamation a bien été enregistrée sous la référence :</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Référence :</strong> ${reference}</p>
                    <p style="margin: 5px 0;"><strong>Titre :</strong> ${title}</p>
                </div>
                <p>Vous pouvez suivre l'avancement de votre réclamation dans votre espace personnel.</p>
                <a href="${process.env.FRONTEND_URL}/reclamations/${reference}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Suivre ma réclamation</a>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    }),

    // Email de changement de statut
    reclamationStatusChanged: (firstName, reference, status) => ({
        subject: `Mise à jour de votre réclamation ${reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Mise à jour de votre réclamation</h2>
                <p>Bonjour <strong>${firstName}</strong>,</p>
                <p>Le statut de votre réclamation ${reference} a changé :</p>
                <div style="background-color: ${status === 'validated' ? '#dcfce7' : status === 'in_progress' ? '#fef3c7' : '#f3f4f6'}; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: ${status === 'validated' ? '#166534' : status === 'in_progress' ? '#92400e' : '#374151'}">
                        ${status === 'pending' ? '📋 En attente' : status === 'in_progress' ? '🔧 En cours' : status === 'validated' ? '✅ Résolue' : '❌ Échouée'}
                    </p>
                </div>
                ${status === 'validated' ? '<p>Votre problème a été résolu. Merci de votre confiance !</p>' : ''}
                <a href="${process.env.FRONTEND_URL}/reclamations/${reference}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir les détails</a>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    }),

    // Email de nouvelle tâche assignée
    taskAssigned: (firstName, description) => ({
        subject: 'Nouvelle tâche assignée',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Nouvelle tâche assignée</h2>
                <p>Bonjour <strong>${firstName}</strong>,</p>
                <p>Une nouvelle tâche vous a été assignée :</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Description :</strong> ${description}</p>
                </div>
                <p>Connectez-vous à votre espace employé pour voir les détails et démarrer la tâche.</p>
                <a href="${process.env.FRONTEND_URL}/employer/tasks" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir mes tâches</a>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    }),

    // Email de paiement reçu
    paymentReceived: (firstName, amount) => ({
        subject: 'Paiement reçu sur votre compte RMS',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Paiement reçu !</h2>
                <p>Bonjour <strong>${firstName}</strong>,</p>
                <p>Vous avez reçu un paiement sur votre compte RMS :</p>
                <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #166534;">${amount} DT</p>
                </div>
                <p>Vous pouvez consulter votre solde et l'historique de vos paiements dans votre espace employé.</p>
                <a href="${process.env.FRONTEND_URL}/employer/balance" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir mon solde</a>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    }),

    // Email de tâche terminée (pour responsable)
    taskCompletedByEmployer: (firstName, taskDescription, reference, employerName) => ({
        subject: `Tâche terminée - ${reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Tâche terminée</h2>
                <p>Bonjour <strong>${firstName}</strong>,</p>
                <p>L'employé <strong>${employerName}</strong> a terminé la tâche suivante :</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Réclamation :</strong> ${reference}</p>
                    <p style="margin: 5px 0;"><strong>Tâche :</strong> ${taskDescription}</p>
                </div>
                <p>Connectez-vous pour valider le travail et consulter les preuves.</p>
                <a href="${process.env.FRONTEND_URL}/responsable/reclamations" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir les détails</a>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    }),

    // Email de tâche en échec
    taskFailedByEmployer: (firstName, taskDescription, reference, employerName, reason) => ({
        subject: `Tâche en échec - ${reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Tâche en échec</h2>
                <p>Bonjour <strong>${firstName}</strong>,</p>
                <p>L'employé <strong>${employerName}</strong> a signalé un échec pour la tâche suivante :</p>
                <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Réclamation :</strong> ${reference}</p>
                    <p style="margin: 5px 0;"><strong>Tâche :</strong> ${taskDescription}</p>
                    <p style="margin: 5px 0;"><strong>Raison :</strong> ${reason}</p>
                </div>
                <p>Connectez-vous pour analyser la situation et prendre les mesures nécessaires.</p>
                <a href="${process.env.FRONTEND_URL}/responsable/reclamations" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Voir les détails</a>
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">© 2026 RMS - Tous droits réservés</p>
            </div>
        `
    })
};

// Envoi d'email avec log
const sendEmail = async (to, subject, html, recipientType, recipientId, actionType, reclamationId = null, taskId = null) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"RMS Platform" <${process.env.SMTP_FROM || 'noreply@rms.com'}>`,
            to,
            subject,
            html
        };
        
        // Envoyer l'email
        const info = await transporter.sendMail(mailOptions);
        
        // Logger l'envoi dans la base de données
        await EmailNotification.create({
            recipient_email: to,
            recipient_type: recipientType,
            recipient_id: recipientId,
            action_type: actionType,
            subject: subject,
            content: html,
            status: 'sent',
            reclamation_id: reclamationId,
            task_id: taskId
        });
        
        console.log(`Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Email sending error:', error);
        
        // Logger l'échec
        await EmailNotification.create({
            recipient_email: to,
            recipient_type: recipientType,
            recipient_id: recipientId,
            action_type: actionType,
            subject: subject,
            content: html,
            status: 'failed',
            reclamation_id: reclamationId,
            task_id: taskId
        });
        
        return { success: false, error: error.message };
    }
};

// Envoi d'email simple (sans log)
const sendSimpleEmail = async (to, subject, html) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"RMS Platform" <${process.env.SMTP_FROM || 'noreply@rms.com'}>`,
            to,
            subject,
            html
        };
        
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Simple email sending error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendEmail,
    sendSimpleEmail,
    emailTemplates
};