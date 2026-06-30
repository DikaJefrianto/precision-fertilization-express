const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');
const rekomendasiController = require('../controllers/rekomendasiController');
const riwayatController = require('../controllers/riwayatController');
const { verifikasiToken } = require('../middleware/authMiddleware');
const { validasiHitungDosis, cekHasilValidasi } = require('../middleware/validatorMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/soils/'); 
    },
    filename: (req, file, cb) => {
        cb(null, 'SOIL-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } 
});

router.use(verifikasiToken);

router.get('/pupuk', adminController.ambilSemuaPupuk);
router.get('/dashboard-stats', riwayatController.getFarmerDashboardStats);

// FIX: Pastikan upload.single('image') ada di urutan pertama
router.post(
    '/hitung-dosis', 
    upload.single('image'), // Menangkap file foto
    validasiHitungDosis,    // Validasi teks (N,P,K dll)
    cekHasilValidasi,       // Cek hasil validasi
    rekomendasiController.hitungDosisPresisi
);

router.get('/riwayat', riwayatController.ambilRiwayatPetani);

module.exports = router;