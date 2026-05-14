const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
    const dirs = [
        'uploads/',
        'uploads/proofs/',
        'uploads/proofs/images/',
        'uploads/proofs/videos/',
        'uploads/avatars/'
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Configuration du stockage pour les avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${uniqueSuffix}${ext}`);
    }
});

// Configuration du stockage pour les preuves
const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fileType = file.mimetype.startsWith('image/') ? 'images' : 'videos';
        cb(null, `uploads/proofs/${fileType}/`);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `proof-${uniqueSuffix}${ext}`);
    }
});

// Filtre pour les avatars
const avatarFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté. Utilisez JPG, PNG ou GIF.'), false);
    }
};

// Filtre pour les preuves
const proofFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté. Utilisez image (JPG, PNG, GIF) ou vidéo (MP4).'), false);
    }
};

// Création des instances multer
const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: avatarFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const proofUpload = multer({
    storage: proofStorage,
    fileFilter: proofFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Exporter l'objet upload avec les méthodes nécessaires
const upload = {
    single: (fieldName) => avatarUpload.single(fieldName),
    array: (fieldName, maxCount) => proofUpload.array(fieldName, maxCount),
    fields: (fields) => proofUpload.fields(fields),
    singleProof: (fieldName) => proofUpload.single(fieldName),
    multipleProofs: (fieldName, maxCount = 10) => proofUpload.array(fieldName, maxCount),
    singleAvatar: (fieldName) => avatarUpload.single(fieldName)
};

// Gestionnaire d'erreurs
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = '';
        switch (err.code) {
            case 'FILE_TOO_LARGE':
                message = 'Le fichier est trop volumineux';
                break;
            case 'LIMIT_FILE_SIZE':
                message = 'Le fichier dépasse la taille maximale autorisée';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Trop de fichiers uploadés';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Fichier inattendu';
                break;
            default:
                message = err.message;
        }
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: message
            }
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: err.message
            }
        });
    }
    next();
};

module.exports = { upload, handleMulterError };