// ==================== CONSTANTES GLOBALES RMS ====================

// Types d'organisations
const ORGANIZATION_TYPES = {
    PUBLIC: 'public',
    PRIVATE: 'private',
    ASSOCIATION: 'association'
};

// Statuts des réclamations (global)
const RECLAMATION_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    VALIDATED: 'validated',
    FAILED: 'failed',
    ARCHIVED: 'archived'
};

// Statuts des réclamations par organisation
const RECLAMATION_ORG_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    VALIDATED: 'validated',
    FAILED: 'failed',
    ARCHIVED: 'archived'
};

// Statuts des tâches
const TASK_STATUS = {
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// Statuts de paiement
const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid'
};

// Types de réclamations
const RECLAMATION_TYPES = {
    ELECTRIQUE: 'electrique',
    NUMERIQUE: 'numerique',
    SECURITE: 'securite',
    VOIRIE: 'voirie',
    PLOMBERIE: 'plomberie',
    AUTRE: 'autre'
};

// Niveaux d'urgence
const URGENCY_LEVELS = {
    NORMAL: 'normal',
    URGENT: 'urgent',
    TRES_URGENT: 'tres_urgent'
};

// Types d'acteurs pour l'historique
const ACTOR_TYPES = {
    ADMIN: 'admin',
    RESPONSABLE: 'responsable',
    EMPLOYER: 'employer',
    USER: 'user'
};

// Types de fichiers pour les preuves
const FILE_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video'
};

// Types de notifications email
const EMAIL_ACTIONS = {
    WELCOME: 'welcome',
    ACCOUNT_CREATED: 'account_created',
    RECLAMATION_CREATED: 'creation',
    STATUS_CHANGE: 'status_change',
    TASK_ASSIGNED: 'task_assigned',
    PAYMENT_RECEIVED: 'payment_received',
    TASK_COMPLETED: 'task_completed',
    TASK_FAILED: 'task_failed'
};

// Types de destinataires email
const EMAIL_RECIPIENT_TYPES = {
    USER: 'user',
    EMPLOYER: 'employer',
    RESPONSABLE: 'responsable',
    ADMIN: 'admin'
};

// Méthodes de paiement
const PAYMENT_METHODS = {
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash',
    MOBILE_PAYMENT: 'mobile_payment'
};

// Gouvernorats tunisiens
const TUNISIAN_GOVERNORATES = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba',
    'Nabeul', 'Zaghouan', 'Bizerte', 'Béja',
    'Jendouba', 'Le Kef', 'Siliana', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan',
    'Kasserine', 'Sidi Bouzid', 'Gabès', 'Médenine',
    'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
];

// Délégations par gouvernorat (principales)
const DELEGATIONS_BY_GOVERNORATE = {
    'Tunis': ['Tunis Centre', 'Bab Bhar', 'Bab Souika', 'El Hafsia', 'El Menzah', 'El Ouardia', 'Ettahrir', 'Hraïria', 'Médina', 'Sidi El Béchir'],
    'Ariana': ['Ariana Ville', 'Ettadhamen', 'Kalaat El Andalous', 'Mnihla', 'Raoued', 'Sidi Thabet', 'Soukra'],
    'Ben Arous': ['Ben Arous', 'Bou Mhel El Bassatine', 'El Mourouj', 'Ezzahra', 'Fouchana', 'Hammam Chott', 'Hammam Lif', 'Mohamedia', 'Mornag', 'Radès'],
    'Sousse': ['Sousse Ville', 'Akouda', 'Bouficha', 'Enfidha', 'Hammam Sousse', 'Hergla', 'Kalaa Kebira', 'Kalaa Sghira', 'Msaken', 'Sidi Bou Ali'],
    'Sfax': ['Sfax Ville', 'Agareb', 'Bir Ali Ben Khalifa', 'El Amra', 'El Ghraiba', 'Gremda', 'Jebeniana', 'Mahrès', 'Menzel Chaker', 'Sakiet Eddaïer', 'Sakiet Ezzit']
};

// Mapping des statuts vers des couleurs (UI)
const STATUS_COLORS = {
    [RECLAMATION_STATUS.PENDING]: '#f59e0b', // orange
    [RECLAMATION_STATUS.IN_PROGRESS]: '#3b82f6', // blue
    [RECLAMATION_STATUS.VALIDATED]: '#10b981', // green
    [RECLAMATION_STATUS.FAILED]: '#ef4444', // red
    [RECLAMATION_STATUS.ARCHIVED]: '#6b7280', // gray
    [TASK_STATUS.ASSIGNED]: '#8b5cf6', // purple
    [TASK_STATUS.IN_PROGRESS]: '#3b82f6', // blue
    [TASK_STATUS.COMPLETED]: '#10b981', // green
    [TASK_STATUS.FAILED]: '#ef4444' // red
};

// Mapping des statuts vers des icônes (UI)
const STATUS_ICONS = {
    [RECLAMATION_STATUS.PENDING]: '📋',
    [RECLAMATION_STATUS.IN_PROGRESS]: '🔧',
    [RECLAMATION_STATUS.VALIDATED]: '✅',
    [RECLAMATION_STATUS.FAILED]: '❌',
    [RECLAMATION_STATUS.ARCHIVED]: '📦',
    [TASK_STATUS.ASSIGNED]: '📌',
    [TASK_STATUS.IN_PROGRESS]: '⚙️',
    [TASK_STATUS.COMPLETED]: '✔️',
    [TASK_STATUS.FAILED]: '⚠️'
};

// Mapping des types de réclamation vers des icônes
const TYPE_ICONS = {
    [RECLAMATION_TYPES.ELECTRIQUE]: '⚡',
    [RECLAMATION_TYPES.NUMERIQUE]: '📡',
    [RECLAMATION_TYPES.SECURITE]: '🔒',
    [RECLAMATION_TYPES.VOIRIE]: '🛣️',
    [RECLAMATION_TYPES.PLOMBERIE]: '💧',
    [RECLAMATION_TYPES.AUTRE]: '📝'
};

// Mapping des urgences vers des couleurs
const URGENCY_COLORS = {
    [URGENCY_LEVELS.NORMAL]: '#10b981', // green
    [URGENCY_LEVELS.URGENT]: '#f59e0b', // orange
    [URGENCY_LEVELS.TRES_URGENT]: '#ef4444' // red
};

// Mapping des urgences vers des délais de réponse (heures)
const URGENCY_RESPONSE_TIMES = {
    [URGENCY_LEVELS.NORMAL]: 72,
    [URGENCY_LEVELS.URGENT]: 24,
    [URGENCY_LEVELS.TRES_URGENT]: 4
};

// Limites par défaut
const DEFAULT_LIMITS = {
    PAGE: 1,
    PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MAX_UPLOAD_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_PROOFS_PER_TASK: 10,
    MAX_MESSAGE_LENGTH: 2000,
    MIN_PASSWORD_LENGTH: 6
};

// Tokens JWT
const JWT_CONFIG = {
    EXPIRE: '7d',
    REFRESH_EXPIRE: '30d'
};

// Codes d'erreur HTTP
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
};

// Messages d'erreur standardisés
const ERROR_MESSAGES = {
    // Auth
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
    ACCOUNT_INACTIVE: 'Votre compte est désactivé',
    TOKEN_EXPIRED: 'Token expiré',
    TOKEN_INVALID: 'Token invalide',
    UNAUTHORIZED: 'Non autorisé',
    FORBIDDEN: 'Accès refusé',
    
    // Validation
    MISSING_FIELDS: 'Champs requis manquants',
    VALIDATION_ERROR: 'Erreur de validation',
    INVALID_DATA: 'Données invalides',
    
    // Resources
    NOT_FOUND: 'Ressource non trouvée',
    ALREADY_EXISTS: 'Ressource déjà existante',
    DUPLICATE_ENTRY: 'Entrée en doublon',
    
    // Business
    INVALID_STATUS_TRANSITION: 'Transition de statut invalide',
    PAYMENT_NOT_ALLOWED: 'Paiement non autorisé pour cette organisation',
    AMOUNT_MISMATCH: 'Montant distribué ne correspond pas',
    INSUFFICIENT_BALANCE: 'Solde insuffisant',
    
    // Server
    SERVER_ERROR: 'Erreur interne du serveur'
};

// Formats de date
const DATE_FORMATS = {
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    DATE_ONLY: 'YYYY-MM-DD',
    TIME_ONLY: 'HH:mm:ss',
    DATETIME_FR: 'DD/MM/YYYY HH:mm',
    DATE_FR: 'DD/MM/YYYY'
};

// Expressions régulières utiles
const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_TUNISIA: /^[0-9]{8}$/,
    CIN_TUNISIA: /^[0-9]{8}$/,
    POSTAL_CODE_TUNISIA: /^[0-9]{4}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
    NAME: /^[a-zA-ZÀ-ÿ\s-]+$/,
    REFERENCE: /^[A-Z]{3}-\d{4}-\d{6}$/,
    LATITUDE: /^-?([1-8]?[0-9]\.?\d*|90\.?\d*)$/,
    LONGITUDE: /^-?((1[0-7]|[1-9])?\d{1,2}\.\d*|180\.?\d*)$/
};

// Configuration des fichiers upload
const UPLOAD_CONFIG = {
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
    ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    MAX_PROOF_FILES: 10,
    MAX_AVATAR_SIZE: 5 * 1024 * 1024,
    MAX_PROOF_SIZE: 50 * 1024 * 1024
};

module.exports = {
    // Types et statuts
    ORGANIZATION_TYPES,
    RECLAMATION_STATUS,
    RECLAMATION_ORG_STATUS,
    TASK_STATUS,
    PAYMENT_STATUS,
    RECLAMATION_TYPES,
    URGENCY_LEVELS,
    ACTOR_TYPES,
    FILE_TYPES,
    EMAIL_ACTIONS,
    EMAIL_RECIPIENT_TYPES,
    PAYMENT_METHODS,
    
    // Géographie
    TUNISIAN_GOVERNORATES,
    DELEGATIONS_BY_GOVERNORATE,
    
    // UI Mapping
    STATUS_COLORS,
    STATUS_ICONS,
    TYPE_ICONS,
    URGENCY_COLORS,
    URGENCY_RESPONSE_TIMES,
    
    // Configuration
    DEFAULT_LIMITS,
    JWT_CONFIG,
    HTTP_STATUS,
    ERROR_MESSAGES,
    DATE_FORMATS,
    REGEX,
    UPLOAD_CONFIG
};