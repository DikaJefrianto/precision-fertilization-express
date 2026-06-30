const db = require('../config/db');
const logger = require('../config/logger');

// Create
exports.tambahPupuk = async (req, res) => {
    const { nama_pupuk, kadar_n_persen, kadar_p_persen, kadar_k_persen, harga_per_kg } = req.body;
    try {
        await db.query(
            "INSERT INTO master_pupuk (nama_pupuk, kadar_n_persen, kadar_p_persen, kadar_k_persen, harga_per_kg) VALUES (?, ?, ?, ?, ?)",
            [nama_pupuk, kadar_n_persen, kadar_p_persen, kadar_k_persen, harga_per_kg]
        );
        
        logger.info(`[Admin] Menambahkan pupuk baru: ${nama_pupuk} oleh Admin ID: ${req.user.id}`);
        res.status(201).json({ message: "[Success] Data master pupuk berhasil ditambahkan" });
    } catch (error) {
        logger.error(`[Admin] Gagal tambah pupuk: ${error.message}`);
        res.status(500).json({ message: `[Error] Gagal menyimpan data: ${error.message}` });
    }
};

// Read
exports.ambilSemuaPupuk = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM master_pupuk ORDER BY id DESC");
        res.json({ 
            message: "[Success] Daftar pupuk berhasil dimuat", 
            data: rows 
        });
    } catch (error) {
        logger.error(`[Admin] Gagal ambil data pupuk: ${error.message}`);
        res.status(500).json({ message: `[Error] Gagal memuat data: ${error.message}` });
    }
};

// Update
exports.updatePupuk = async (req, res) => {
    const { id } = req.params;
    const { nama_pupuk, kadar_n_persen, kadar_p_persen, kadar_k_persen, harga_per_kg } = req.body;
    try {
        const [cek] = await db.query("SELECT id FROM master_pupuk WHERE id = ?", [id]);
        if (cek.length === 0) return res.status(404).json({ message: "[Error] Data tidak ditemukan" });

        await db.query(
            "UPDATE master_pupuk SET nama_pupuk=?, kadar_n_persen=?, kadar_p_persen=?, kadar_k_persen=?, harga_per_kg=? WHERE id=?",
            [nama_pupuk, kadar_n_persen, kadar_p_persen, kadar_k_persen, harga_per_kg, id]
        );

        logger.info(`[Admin] Update pupuk ID ${id}: ${nama_pupuk} berhasil`);
        res.json({ message: "[Success] Data pupuk berhasil diperbarui" });
    } catch (error) {
        logger.error(`[Admin] Gagal update pupuk ID ${id}: ${error.message}`);
        res.status(500).json({ message: `[Error] Gagal update: ${error.message}` });
    }
};

// Delete
exports.hapusPupuk = async (req, res) => {
    const { id } = req.params;
    try {
        const [cek] = await db.query("SELECT nama_pupuk FROM master_pupuk WHERE id = ?", [id]);
        if (cek.length === 0) return res.status(404).json({ message: "[Error] Data tidak ditemukan" });

        await db.query("DELETE FROM master_pupuk WHERE id = ?", [id]);

        logger.warn(`[Admin] Hapus pupuk: ${cek[0].nama_pupuk} (ID: ${id}) oleh Admin ID: ${req.user.id}`);
        res.json({ message: "[Success] Pupuk berhasil dihapus dari database" });
    } catch (error) {
        logger.error(`[Admin] Gagal hapus pupuk ID ${id}: ${error.message}`);
        res.status(500).json({ message: `[Error] Gagal menghapus: ${error.message}` });
    }
};

//stats
exports.getStats = async (req, res) => {
    try {
        const [users] = await db.query("SELECT COUNT(*) as total FROM pengguna");
        const [detections] = await db.query("SELECT COUNT(*) as total FROM riwayat");
        const [pupuk] = await db.query("SELECT COUNT(*) as total FROM master_pupuk");

        res.json({
            message: "[Success] Statistik berhasil dimuat",
            data: {
                total_users: users[0].total,
                total_detections: detections[0].total,
                total_saved: detections[0].total 
            }
        });
        
        logger.info(`[Admin] Statistik diakses oleh Admin ID: ${req.user.id}`);
    } catch (error) {
        logger.error(`[Admin] Gagal memuat statistik: ${error.message}`);
        res.status(500).json({ 
            message: "[Error] Gagal mengambil data statistik", 
            error: error.message 
        });
    }
};