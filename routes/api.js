const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const rek = require('../controllers/rekomendasiController');
const adm = require('../controllers/adminController');
const { verifikasiToken, cekRole } = require('../middleware/authMiddleware');

// Route Publik
router.post('/register', auth.registrasi);
router.post('/login', auth.login);

// Route Petani (Butuh Login)
router.post('/hitung-pupuk', verifikasiToken, rek.hitungDosis);

// Route Admin (Butuh Login + Role Admin)
router.post('/admin/tambah-pupuk', verifikasiToken, cekRole('Admin'), adm.kelolaPupuk);
router.post('/admin/update-aturan', verifikasiToken, cekRole('Admin'), adm.updateTargetHara);

module.exports = router;