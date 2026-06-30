const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const verifikasiToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn(`[Security] Percobaan akses tanpa token pada URL: ${req.originalUrl}`);
        return res.status(403).json({ message: "[Error] Akses ditolak, token tidak ditemukan" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            logger.error(`[Security] Token tidak valid atau kadaluwarsa: ${err.message}`);
            return res.status(401).json({ message: "[Error] Sesi login tidak valid atau kadaluwarsa" });
        }
        req.user = decoded;
        next();
    });
};

const cekRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            logger.warn(`[Security] Akses Denied! User ID ${req.user.id} mencoba akses fitur ${role}`);
            return res.status(403).json({ message: `[Error] Akses ditolak: Anda bukan ${role}` });
        }
        next();
    };
};

module.exports = { verifikasiToken, cekRole };