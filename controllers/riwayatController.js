const db = require('../config/db');

exports.ambilRiwayatPetani = async (req, res) => {
    const id_user = req.user.id;

    try {

        const [rows] = await db.query(
            "SELECT id, id_pengguna, jalur_foto, label_tanah_ai, n_input, p_input, k_input, hst_input, luas_lahan, rekomendasi_hasil, tanggal_simpan FROM riwayat WHERE id_pengguna = ? ORDER BY tanggal_simpan DESC",
            [id_user]
        );

        const dataTerformat = rows.map(item => {
            let fotoUrl = item.jalur_foto;

            if (fotoUrl && !fotoUrl.startsWith('http')) {

                fotoUrl = `${req.protocol}://${req.get('host')}/uploads/soils/${fotoUrl}`;
            }

            return {
                ...item,
                jalur_foto: fotoUrl 
            };
        });
        return res.json({
            status: "success",
            data: dataTerformat
        });

    } catch (error) {
        if (typeof logger !== 'undefined' && logger.error) {
            logger.error(`[Riwayat Error] ${error.message}`);
        } else {
            console.error("[Riwayat Error]", error.message);
        }
        
        return res.status(500).json({ 
            status: "error", 
            message: "Gagal memuat riwayat: " + error.message 
        });
    }
};

exports.getFarmerDashboardStats = async (req, res) => {
    const id_user = req.user.id;
    try {
        const [userRows] = await db.query(
            "SELECT nama, foto_profil FROM pengguna WHERE id = ?", 
            [id_user]
        );

        const [areaRows] = await db.query(
            "SELECT SUM(luas_lahan) as total_hektar FROM riwayat WHERE id_pengguna = ?", 
            [id_user]
        );

        const [latestRows] = await db.query(
            "SELECT rekomendasi_hasil FROM riwayat WHERE id_pengguna = ? ORDER BY tanggal_simpan DESC LIMIT 1", 
            [id_user]
        );

        const [historyRows] = await db.query(
            "SELECT id, label_tanah_ai, rekomendasi_hasil, DATE_FORMAT(tanggal_simpan, '%d %b %Y') as tanggal_simpan FROM riwayat WHERE id_pengguna = ? ORDER BY tanggal_simpan DESC LIMIT 5", 
            [id_user]
        );

        res.json({
            message: "[Success] Data dashboard berhasil dimuat",
            user_info: {
                nama: userRows[0]?.nama || "Petani",
                foto_profil: userRows[0]?.foto_profil || null // Pastikan baris ini ada
            },
            stats: {
                total_hektar: areaRows[0]?.total_hektar || 0,
                latest_recommendation: latestRows[0]?.rekomendasi_hasil || "Belum ada riwayat"
            },
            history: historyRows
        });
    } catch (error) {
        res.status(500).json({ message: `[Error] ${error.message}` });
    }
};