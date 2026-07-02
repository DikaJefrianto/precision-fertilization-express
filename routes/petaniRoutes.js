const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os'); // CRITICAL FIX: Tambah modul OS bawaan Node.js
const adminController = require('../controllers/adminController');
const rekomendasiController = require('../controllers/rekomendasiController');
const riwayatController = require('../controllers/riwayatController');
const { verifikasiToken } = require('../middleware/authMiddleware');
const { validasiHitungDosis, cekHasilValidasi } = require('../middleware/validatorMiddleware');

// CONFIGURATION FIX: Alihkan penyimpanan Multer ke folder temporary /tmp Vercel
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // os.tmpdir() secara otomatis mengarah ke folder /tmp yang diizinkan Vercel
        cb(null, os.tmpdir()); 
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

// Route hitung dosis tetap aman menggunakan urutan middleware milikmu
router.post(
    '/hitung-dosis', 
    upload.single('image'), // Menangkap file foto dan menaruhnya aman di /tmp
    validasiHitungDosis,    // Validasi unsur hara teks (N, P, K, HST)
    cekHasilValidasi,       // Cek hasil validasi teks
    rekomendasiController.hitungDosisPresisi // Dioper ke Controller utama
);

router.get('/riwayat', riwayatController.ambilRiwayatPetani);

module.exports = router;