const db = require('../config/db');
const logger = require('../config/logger');

// Create - Menambahkan aturan hara baru dengan kategori Fase
exports.tambahAturan = async (req, res) => {
    // TAMBAHKAN label_tanah di sini
    const { nama_fase, label_tanah, rentang_hst, target_n, target_p, target_k, saran_pakar } = req.body;
    try {
        await db.query(
            "INSERT INTO pakar_hara (nama_fase, label_tanah, rentang_hst, target_n, target_p, target_k, saran_pakar) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [nama_fase, label_tanah, rentang_hst, target_n, target_p, target_k, saran_pakar]
        );
        res.status(201).json({ message: "[Success] Aturan hara berhasil disimpan" });
    } catch (error) {
        res.status(500).json({ message: `[Error] ${error.message}` });
    }
};

// Read - Mengambil semua aturan hara
exports.ambilSemuaAturan = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM pakar_hara ORDER BY id ASC");
        res.json({ 
            message: "[Success] Data aturan pakar berhasil dimuat", 
            data: rows 
        });
    } catch (error) {
        logger.error(`[Admin] Gagal ambil data pakar: ${error.message}`);
        res.status(500).json({ message: `[Error] Gagal memuat data: ${error.message}` });
    }
};

// Update - Memperbarui aturan hara yang sudah ada
exports.updateAturan = async (req, res) => {
    const { id } = req.params;
    const { nama_fase, label_tanah, rentang_hst, target_n, target_p, target_k, saran_pakar } = req.body;
    try {
        await db.query(
            "UPDATE pakar_hara SET nama_fase=?, label_tanah=?, rentang_hst=?, target_n=?, target_p=?, target_k=?, saran_pakar=? WHERE id=?",
            [nama_fase, label_tanah, rentang_hst, target_n, target_p, target_k, saran_pakar, id]
        );
        res.json({ message: "[Success] Aturan pakar berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ message: `[Error] ${error.message}` });
    }
};

// Delete - Menghapus aturan hara
exports.hapusAturan = async (req, res) => {
    const { id } = req.params;
    try {
        const [cek] = await db.query("SELECT id, nama_fase FROM pakar_hara WHERE id = ?", [id]);
        if (cek.length === 0) return res.status(404).json({ message: "[Error] Aturan tidak ditemukan" });

        await db.query("DELETE FROM pakar_hara WHERE id = ?", [id]);

        logger.warn(`[Admin] Menghapus aturan hara fase: ${cek[0].nama_fase} (ID: ${id})`);
        res.json({ message: "[Success] Aturan hara berhasil dihapus dari sistem" });
    } catch (error) {
        logger.error(`[Admin] Gagal hapus aturan: ${error.message}`);
        res.status(500).json({ message: `[Error] Gagal menghapus aturan` });
    }
};