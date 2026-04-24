const db = require('../config/database');

// Import des modèles
const Admin = require('./Admin');
const Responsable = require('./Responsable');
const Employer = require('./Employer');
const User = require('./User');
const Organization = require('./Organization');
const Reclamation = require('./Reclamation');
const ReclamationOrganization = require('./ReclamationOrganization');
const Task = require('./Task');
const Proof = require('./Proof');
const PaymentDistribution = require('./PaymentDistribution');
const PaymentItem = require('./PaymentItem');
const EmailNotification = require('./EmailNotification');
const StatusHistory = require('./StatusHistory');
const ReclamationMessage = require('./ReclamationMessage');

// Associations entre modèles
const initModels = () => {
    // Un responsable appartient à une organisation
    Responsable.belongsTo(Organization, { foreignKey: 'organization_id' });
    Organization.hasMany(Responsable, { foreignKey: 'organization_id' });

    // Un employé appartient à une organisation
    Employer.belongsTo(Organization, { foreignKey: 'organization_id' });
    Organization.hasMany(Employer, { foreignKey: 'organization_id' });

    // Une réclamation appartient à un utilisateur
    Reclamation.belongsTo(User, { foreignKey: 'user_id' });
    User.hasMany(Reclamation, { foreignKey: 'user_id' });

    // ReclamationOrganization belongs to Reclamation and Organization
    ReclamationOrganization.belongsTo(Reclamation, { foreignKey: 'reclamation_id' });
    ReclamationOrganization.belongsTo(Organization, { foreignKey: 'organization_id' });
    Reclamation.hasMany(ReclamationOrganization, { foreignKey: 'reclamation_id' });
    Organization.hasMany(ReclamationOrganization, { foreignKey: 'organization_id' });

    // Une tâche appartient à ReclamationOrganization et à Employer
    Task.belongsTo(ReclamationOrganization, { foreignKey: 'reclamation_org_id' });
    Task.belongsTo(Employer, { foreignKey: 'employer_id' });
    ReclamationOrganization.hasMany(Task, { foreignKey: 'reclamation_org_id' });
    Employer.hasMany(Task, { foreignKey: 'employer_id' });

    // Une preuve appartient à une tâche
    Proof.belongsTo(Task, { foreignKey: 'task_id' });
    Task.hasMany(Proof, { foreignKey: 'task_id' });

    // PaymentDistribution belongs to ReclamationOrganization and Responsable
    PaymentDistribution.belongsTo(ReclamationOrganization, { foreignKey: 'reclamation_org_id' });
    PaymentDistribution.belongsTo(Responsable, { foreignKey: 'responsable_id' });
    ReclamationOrganization.hasMany(PaymentDistribution, { foreignKey: 'reclamation_org_id' });

    // PaymentItem belongs to PaymentDistribution and Employer
    PaymentItem.belongsTo(PaymentDistribution, { foreignKey: 'payment_distribution_id' });
    PaymentItem.belongsTo(Employer, { foreignKey: 'employer_id' });
    PaymentItem.belongsTo(Task, { foreignKey: 'task_id' });
    PaymentDistribution.hasMany(PaymentItem, { foreignKey: 'payment_distribution_id' });
    Employer.hasMany(PaymentItem, { foreignKey: 'employer_id' });

    // EmailNotification belongs to Reclamation and Task
    EmailNotification.belongsTo(Reclamation, { foreignKey: 'reclamation_id' });
    EmailNotification.belongsTo(Task, { foreignKey: 'task_id' });

    // StatusHistory polymorphic relationships
    StatusHistory.belongsTo(Reclamation, { foreignKey: 'reclamation_id' });
    StatusHistory.belongsTo(ReclamationOrganization, { foreignKey: 'reclamation_org_id' });
    StatusHistory.belongsTo(Task, { foreignKey: 'task_id' });

    // ReclamationMessage belongs to ReclamationOrganization
    ReclamationMessage.belongsTo(ReclamationOrganization, { foreignKey: 'reclamation_org_id' });
    ReclamationOrganization.hasMany(ReclamationMessage, { foreignKey: 'reclamation_org_id' });
};

module.exports = {
    db,
    Admin,
    Responsable,
    Employer,
    User,
    Organization,
    Reclamation,
    ReclamationOrganization,
    Task,
    Proof,
    PaymentDistribution,
    PaymentItem,
    EmailNotification,
    StatusHistory,
    ReclamationMessage,
    initModels
};