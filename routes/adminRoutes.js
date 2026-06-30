// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const pakarController = require('../controllers/pakarController');
const { verifikasiToken, cekRole } = require('../middleware/authMiddleware');
const { 
    validasiMasterPupuk, 
    validasiMasterPakar, 
    cekHasilValidasi 
} = require('../middleware/validatorMiddleware');

// Verifikasi Token
router.use(verifikasiToken);
router.use(cekRole('Admin'));

// CRUD Master Pupuk (Hanya POST, PUT, DELETE)
router.post('/pupuk', validasiMasterPupuk, cekHasilValidasi, adminController.tambahPupuk);
router.put('/pupuk/:id', validasiMasterPupuk, cekHasilValidasi, adminController.updatePupuk);
router.delete('/pupuk/:id', adminController.hapusPupuk);

// CRUD Aturan Pakar
router.get('/pakar', pakarController.ambilSemuaAturan);
router.post('/pakar', validasiMasterPakar, cekHasilValidasi, pakarController.tambahAturan);
router.put('/pakar/:id', validasiMasterPakar, cekHasilValidasi, pakarController.updateAturan);
router.delete('/pakar/:id', pakarController.hapusAturan);

router.get('/stats', verifikasiToken, cekRole('Admin'), adminController.getStats);

module.exports = router;