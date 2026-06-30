const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const authController = require('../controllers/authController');
const { verifikasiToken } = require('../middleware/authMiddleware'); 
const { 
    validasiRegistrasi, 
    validasiLogin, 
    validasiUpdateProfil, 
    cekHasilValidasi 
} = require('../middleware/validatorMiddleware');

const storage = multer.diskStorage({
    destination: 'uploads/profiles/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    console.log("Mimetype dari HP:", file.mimetype);
    console.log("Nama File dari HP:", file.originalname);


    const allowedTypes = /jpeg|jpg|png|webp/; 
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('[Error] Format file ' + path.extname(file.originalname) + ' tidak didukung!'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadWrapper = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: "[Error] File terlalu besar, maksimal 2MB" });
            }
            return res.status(400).json({ message: `[Error] ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.post('/register', validasiRegistrasi, cekHasilValidasi, authController.registrasi);
router.post('/login', validasiLogin, cekHasilValidasi, authController.login);

router.get('/profile', verifikasiToken, authController.getProfile);
router.put('/update-profile', verifikasiToken, validasiUpdateProfil, cekHasilValidasi, authController.updateProfile);
router.post('/upload-photo', verifikasiToken, uploadWrapper, authController.uploadFoto);

module.exports = router;