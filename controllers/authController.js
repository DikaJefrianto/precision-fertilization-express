const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

exports.registrasi = async (req, res) => {
    const { nama, email, password, no_whatsapp } = req.body;
    try {
        logger.info(`[Auth] Memulai proses registrasi untuk email: ${email}`);
        const [userLama] = await db.query("SELECT id FROM pengguna WHERE email = ?", [email]);
        if (userLama.length > 0) {
            logger.warn(`[Auth] Registrasi gagal: Email ${email} sudah terdaftar`);
            return res.status(400).json({ message: "[Error] Email sudah terdaftar, silakan gunakan email lain" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO pengguna (nama, email, password, no_whatsapp, role) VALUES (?, ?, ?, ?, 'Petani')",
            [nama, email, hashedPassword, no_whatsapp]
        );
        logger.info(`[Auth] Registrasi berhasil: ${email} terdaftar sebagai Petani`);
        res.status(201).json({ message: "[Success] Pendaftaran akun Petani berhasil!" });
    } catch (error) {
        logger.error(`[Auth] Error saat registrasi email ${email}: ${error.message}`);
        res.status(500).json({ message: `[Error] Gagal mendaftar: ${error.message}` });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        logger.info(`[Auth] Percobaan login: ${email}`);
        const [rows] = await db.query("SELECT * FROM pengguna WHERE email = ?", [email]);
        if (rows.length === 0) {
            logger.warn(`[Auth] Login gagal: Email ${email} tidak ditemukan`);
            return res.status(404).json({ message: "[Error] Email tidak terdaftar" });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`[Auth] Login gagal: Password salah untuk email ${email}`);
            return res.status(401).json({ message: "[Error] Password yang Anda masukkan salah" });
        }
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        logger.info(`[Auth] Login sukses: ${email} (${user.role}) masuk ke sistem`);
        res.json({ 
            message: "[Success] Berhasil masuk ke sistem",
            token, 
            user: { id: user.id, nama: user.nama, role: user.role } 
        });
    } catch (error) {
        logger.error(`[Auth] Kesalahan server saat login ${email}: ${error.message}`);
        res.status(500).json({ message: `[Error] Kesalahan Server: ${error.message}` });
    }
};

exports.getProfile = async (req, res) => {
    const userId = req.user.id; 
    try {
        const [rows] = await db.query(
            "SELECT id, nama, email, no_whatsapp, role, foto_profil, tanggal_daftar FROM pengguna WHERE id = ?", 
            [userId]
        );
        if (rows.length === 0) return res.status(404).json({ message: "[Error] User tidak ditemukan" });
        res.json({ message: "[Success] Profil berhasil dimuat", data: rows[0] });
    } catch (error) {
        res.status(500).json({ message: "[Error] Gagal mengambil data profil" });
    }
};

exports.updateProfile = async (req, res) => {
    const { nama, no_whatsapp } = req.body;
    const userId = req.user.id;
    try {
        await db.query(
            "UPDATE pengguna SET nama = ?, no_whatsapp = ? WHERE id = ?",
            [nama, no_whatsapp, userId]
        );
        res.json({ message: "[Success] Profil berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ message: "[Error] Gagal memperbarui profil" });
    }
};

exports.uploadFoto = async (req, res) => {
    const userId = req.user.id;
    console.log("File yang diterima Multer:", req.file); 
    if (!req.file) {
        return res.status(400).json({ message: "[Error] Foto tidak ditemukan di server" });
    }
    try {
        const [rows] = await db.query("SELECT foto_profil FROM pengguna WHERE id = ?", [userId]);
        if (rows[0].foto_profil) {
            const oldPath = path.join(__dirname, '../uploads/profiles/', rows[0].foto_profil);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        const fileName = req.file.filename;
        await db.query("UPDATE pengguna SET foto_profil = ? WHERE id = ?", [fileName, userId]);
        res.json({ 
            message: "[Success] Foto profil berhasil diperbarui",
            foto_url: fileName 
        });
    } catch (error) {
        res.status(500).json({ message: "[Error] Gagal upload foto" });
    }
};