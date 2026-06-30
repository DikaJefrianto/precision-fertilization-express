const { body, validationResult } = require('express-validator');

// Aturan validasi untuk Registrasi
const validasiRegistrasi = [
    body('nama').notEmpty().withMessage('[Error] Nama lengkap tidak boleh kosong'),
    
    body('email')
        .isEmail().withMessage('[Error] Format email tidak valid')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 8 }).withMessage('[Error] Password minimal 8 karakter')
        .matches(/\d/).withMessage('[Error] Password harus mengandung setidaknya satu angka')
        .matches(/[a-zA-Z]/).withMessage('[Error] Password harus mengandung setidaknya satu huruf'),
    
    body('no_whatsapp')
        .isNumeric().withMessage('[Error] Nomor WhatsApp harus berupa angka')
        .isLength({ min: 10, max: 15 }).withMessage('[Error] Nomor WhatsApp tidak valid (min 10-15 digit)'),
    
    body('role')
        .optional()
        .isIn(['Petani', 'Admin']).withMessage('[Error] Role harus Petani atau Admin')
];

// Aturan validasi untuk Login
const validasiLogin = [
    body('email').isEmail().withMessage('[Error] Masukkan email yang valid'),
    body('password').notEmpty().withMessage('[Error] Password tidak boleh kosong')
];

const cekHasilValidasi = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
};
// validasi input data master
const validasiMasterPupuk = [
    body('nama_pupuk').notEmpty().withMessage('[Error] Nama pupuk tidak boleh kosong'),
    body('kadar_n_persen')
        .isFloat({ min: 0, max: 100 }).withMessage('[Error] Kadar Nitrogen harus antara 0 - 100%'),
    body('kadar_p_persen')
        .isFloat({ min: 0, max: 100 }).withMessage('[Error] Kadar Fosfor harus antara 0 - 100%'),
    body('kadar_k_persen')
        .isFloat({ min: 0, max: 100 }).withMessage('[Error] Kadar Kalium harus antara 0 - 100%'),
    body('harga_per_kg')
        .isFloat({ min: 0 }).withMessage('[Error] Harga harus berupa angka positif')
];

// validasi input data master pakar
const validasiMasterPakar = [
    body('rentang_hst')
        .notEmpty().withMessage('[Error] Rentang HST wajib diisi (contoh: 10-20)'),
    body('target_n')
        .isFloat({ min: 0 }).withMessage('[Error] Target Nitrogen harus angka positif'),
    body('target_p')
        .isFloat({ min: 0 }).withMessage('[Error] Target Fosfor harus angka positif'),
    body('target_k')
        .isFloat({ min: 0 }).withMessage('[Error] Target Kalium harus angka positif'),
    body('saran_pakar')
        .notEmpty().withMessage('[Error] Saran pakar tidak boleh kosong')
];

// validasi menghitung dosis
const validasiHitungDosis = [
    body('label_tanah_ai').notEmpty().withMessage('[Error] Label tanah harus ada'),
    body('n_input').isFloat({ min: 0 }).withMessage('[Error] Nilai Nitrogen tidak valid'),
    body('p_input').isFloat({ min: 0 }).withMessage('[Error] Nilai Fosfor tidak valid'),
    body('k_input').isFloat({ min: 0 }).withMessage('[Error] Nilai Kalium tidak valid'),
    body('hst_input').isInt({ min: 0 }).withMessage('[Error] Usia tanaman harus angka positif'),
];
const validasiUpdateProfil = [
    body('nama')
        .trim()
        .isLength({ min: 3 }).withMessage('[Error] Nama lengkap minimal 3 karakter'),
    
    body('no_whatsapp')
        .isNumeric().withMessage('[Error] Nomor WhatsApp harus berupa angka')
        .isLength({ min: 10, max: 15 }).withMessage('[Error] Nomor WhatsApp minimal 10-15 digit')
];

module.exports = { validasiRegistrasi, validasiLogin, cekHasilValidasi , validasiMasterPupuk ,validasiMasterPakar, validasiHitungDosis, validasiUpdateProfil};