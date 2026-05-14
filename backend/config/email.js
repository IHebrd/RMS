const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Configuration du transporteur
let transporter = null;

// Initialiser le transporteur email
const initTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };
    
    // Pour les services de développement (Mailtrap, Ethereal)
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
        // Créer un compte Ethereal pour les tests
        return nodemailer.createTestAccount((err, account) => {
            if (err) {
                console.error('❌ Erreur création compte Ethereal:', err);
                return;
            }
            console.log('📧 Compte Ethereal créé:', account.user);
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
        });
    }
    
    transporter = nodemailer.createTransport(config);
    
    // Vérifier la connexion
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Erreur connexion SMTP:', error);
        } else {
            console.log('✅ Serveur email prêt à envoyer des messages');
        }
    });
};

// Charger un template HTML
const loadTemplate = (templateName, variables = {}) => {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
        console.error(`Template non trouvé: ${templateName}`);
        return null;
    }
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    return template(variables);
};

// Envoyer un email avec template
const sendEmailWithTemplate = async (to, subject, templateName, variables = {}) => {
    if (!transporter) {
        initTransporter();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const html = loadTemplate(templateName, variables);
    
    if (!html) {
        throw new Error(`Template ${templateName} non trouvé`);
    }
    
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'RMS Platform'}" <${process.env.SMTP_FROM || 'noreply@rms.com'}>`,
        to,
        subject,
        html
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        
        // Pour Ethereal, afficher l'URL de prévisualisation
        if (process.env.NODE_ENV === 'development' && info.messageId) {
            console.log('📧 Email envoyé, URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return { success: false, error: error.message };
    }
};

// Envoyer un email simple
const sendSimpleEmail = async (to, subject, html, text = null) => {
    if (!transporter) {
        initTransporter();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'RMS Platform'}" <${process.env.SMTP_FROM || 'noreply@rms.com'}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        
        if (process.env.NODE_ENV === 'development' && info.messageId) {
            console.log('📧 Email envoyé, URL de prévisualisation:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return { success: false, error: error.message };
    }
};

// Envoyer un email HTML personnalisé
const sendCustomEmail = async (to, subject, html) => {
    return sendSimpleEmail(to, subject, html);
};

// Envoyer un email en texte brut
const sendTextEmail = async (to, subject, text) => {
    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'RMS Platform'}" <${process.env.SMTP_FROM || 'noreply@rms.com'}>`,
        to,
        subject,
        text
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erreur envoi email texte:', error);
        return { success: false, error: error.message };
    }
};

// Envoyer un email à plusieurs destinataires
const sendBulkEmail = async (recipients, subject, html) => {
    const results = [];
    
    for (const recipient of recipients) {
        const result = await sendSimpleEmail(recipient, subject, html);
        results.push({ email: recipient, ...result });
    }
    
    return results;
};

// Configurations prédéfinies
const emailConfigs = {
    // Email de bienvenue
    welcome: (firstName, lastName) => ({
        subject: 'Bienvenue sur RMS - Reclamation Management System',
        template: 'welcome',
        variables: { firstName, lastName }
    }),
    
    // Email de création de compte
    accountCreated: (firstName, lastName, email, password, role) => ({
        subject: 'Votre compte RMS a été créé',
        template: 'account_created',
        variables: { firstName, lastName, email, password, role }
    }),
    
    // Email de réclamation créée
    reclamationCreated: (firstName, reference, title) => ({
        subject: `Confirmation de votre réclamation ${reference}`,
        template: 'reclamation_created',
        variables: { firstName, reference, title }
    }),
    
    // Email de changement de statut
    statusChanged: (firstName, reference, status) => ({
        subject: `Mise à jour de votre réclamation ${reference}`,
        template: 'status_changed',
        variables: { firstName, reference, status }
    }),
    
    // Email de tâche assignée
    taskAssigned: (firstName, description) => ({
        subject: 'Nouvelle tâche assignée',
        template: 'task_assigned',
        variables: { firstName, description }
    }),
    
    // Email de paiement reçu
    paymentReceived: (firstName, amount) => ({
        subject: 'Paiement reçu sur votre compte RMS',
        template: 'payment_received',
        variables: { firstName, amount: amount + ' DT' }
    }),
    
    // Email de réinitialisation mot de passe
    resetPassword: (firstName, resetLink) => ({
        subject: 'Réinitialisation de votre mot de passe RMS',
        template: 'reset_password',
        variables: { firstName, resetLink }
    })
};

module.exports = {
    initTransporter,
    sendEmailWithTemplate,
    sendSimpleEmail,
    sendCustomEmail,
    sendTextEmail,
    sendBulkEmail,
    emailConfigs,
    loadTemplate
};