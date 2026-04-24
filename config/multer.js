const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirectories = () => {
    const directories = [
        'uploads/',
        'uploads/proofs/',
        'uploads/proofs/images/',
        'uploads/proofs/videos/',
        'uploads/avatars/',
        'uploads/temp/'
    ];
    
    directories.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`📁 Dossier créé: ${dir}`);
        }
    });
};

createUploadDirectories();

// Configuration du stockage pour les preuves
const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const fileType = file.mimetype.startsWith('image/') ? 'images' : 'videos';
        const dir = path.join(process.cwd(), `uploads/proofs/${fileType}/`);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.]/g, '_')
            .substring(0, 50);
        cb(null, `proof_${uniqueSuffix}_${sanitizedName}${ext}`);
    }
});

// Configuration du stockage pour les avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'uploads/avatars/');
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const userId = req.userId || 'anonymous';
        cb(null, `avatar_${userId}_${uniqueSuffix}${ext}`);
    }
});

// Configuration du stockage temporaire
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'uploads/temp/');
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `temp_${uniqueSuffix}${ext}`);
    }
});

// Filtrage des fichiers pour les preuves
const proofFileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Format de fichier non supporté. Types acceptés: ${[...allowedImageTypes, ...allowedVideoTypes].join(', ')}`), false);
    }
};

// Filtrage des fichiers pour les avatars
const avatarFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Format d'avatar non supporté. Types acceptés: ${allowedTypes.join(', ')}`), false);
    }
};

// Limites de taille
const limits = {
    proof: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10 // Maximum 10 fichiers par requête
    },
    avatar: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    temp: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 20
    }
};

// Middlewares multer préconfigurés
const uploadProof = multer({
    storage: proofStorage,
    fileFilter: proofFileFilter,
    limits: limits.proof
});

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: limits.avatar
});

const uploadTemp = multer({
    storage: tempStorage,
    fileFilter: proofFileFilter,
    limits: limits.temp
});

// Middlewares prêts à l'emploi
const upload = {
    // Upload unique pour preuve
    singleProof: (fieldName = 'proof') => uploadProof.single(fieldName),
    
    // Upload multiple pour preuves
    multipleProofs: (fieldName = 'proofs', maxCount = 10) => uploadProof.array(fieldName, maxCount),
    
    // Upload unique pour avatar
    singleAvatar: (fieldName = 'avatar') => uploadAvatar.single(fieldName),
    
    // Upload de fichiers variés
    fieldsProofs: (fields) => uploadProof.fields(fields),
    
    // Upload temporaire
    tempUpload: (fieldName = 'file') => uploadTemp.single(fieldName),
    tempUploadMultiple: (fieldName = 'files', maxCount = 20) => uploadTemp.array(fieldName, maxCount)
};

// Gestionnaire d'erreurs pour multer
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
            case 'LIMIT_FIELD_KEY':
                message = 'Nom de champ trop long';
                break;
            case 'LIMIT_FIELD_VALUE':
                message = 'Valeur de champ trop longue';
                break;
            case 'LIMIT_FIELD_COUNT':
                message = 'Trop de champs';
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
    next(err);
};

// Nettoyer les fichiers temporaires (plus vieux que 1 heure)
const cleanTempFiles = () => {
    const tempDir = path.join(process.cwd(), 'uploads/temp/');
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    if (fs.existsSync(tempDir)) {
        fs.readdir(tempDir, (err, files) => {
            if (err) return;
            
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    if (stats.mtimeMs < oneHourAgo) {
                        fs.unlink(filePath, (err) => {
                            if (err) console.error(`Erreur suppression fichier temp: ${filePath}`);
                        });
                    }
                });
            });
        });
    }
};

// Nettoyer toutes les 6 heures
setInterval(cleanTempFiles, 6 * 60 * 60 * 1000);

// Fonction pour supprimer un fichier
const deleteFile = (filePath) => {
    if (!filePath) return false;
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
    }
    return false;
};

// Fonction pour obtenir l'URL d'un fichier
const getFileUrl = (req, filePath) => {
    if (!filePath) return null;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

module.exports = {
    upload,
    handleMulterError,
    deleteFile,
    getFileUrl,
    cleanTempFiles,
    // Export des configurations pour réutilisation
    config: {
        proofStorage,
        avatarStorage,
        proofFileFilter,
        avatarFileFilter,
        limits
    }
};