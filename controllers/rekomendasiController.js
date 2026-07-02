const db = require('../config/db');
const logger = require('../config/logger');
const fs = require('fs'); // Tambahan modul File System bawaan Node.js
const cloudinary = require('cloudinary').v2; // Tambahan SDK Cloudinary

// ============================================================
// 1. KONFIGURASI KREDENSIAL CLOUDINARY
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.hitungDosisPresisi = async (req, res) => {
    // Ambil parameter teks dari req.body yang dikirim Flutter
    const { 
        label_tanah_ai, 
        n_input, 
        p_input, 
        k_input, 
        hst_input, 
        luas_lahan, 
        accuracy_input 
    } = req.body;
    
    const id_user = req.user.id;
    
    // Ambil jalur lengkap file temporary dari /tmp Vercel
    const localFilePath = req.file ? req.file.path : null;
    let finalImageUrl = null; // Menampung URL permanen dari Cloudinary

    try {
        console.log(`[DEBUG] Accuracy received from Flutter: ${accuracy_input}`);
        logger.info(`[Expert System] Menghitung dosis untuk User: ${id_user}, Tanah: ${label_tanah_ai}`);

        // ============================================================
        // 2. PROSES UNGGAH GAMBAR KE CLOUDINARY (PERMANEN)
        // ============================================================
        if (localFilePath) {
            const uploadResult = await cloudinary.uploader.upload(localFilePath, {
                folder: 'fertiscan/soils', // Folder penyimpanan di Cloudinary
                resource_type: 'image'
            });
            
            // Simpan URL HTTPS permanen dari Cloudinary
            finalImageUrl = uploadResult.secure_url;
            console.log(`[DEBUG] Image successfully uploaded permanently to Cloudinary: ${finalImageUrl}`);

            // CRITICAL CLEANUP: Langsung hapus file fisik di /tmp Vercel agar RAM bersih
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        }

        const luas = parseFloat(luas_lahan) || 1;

        // 3. Ambil Target Hara dari Pakar berdasarkan Label Tanah dan HST
        const [rowsPakar] = await db.query(
            "SELECT * FROM pakar_hara WHERE label_tanah = ? AND ? BETWEEN CAST(SUBSTRING_INDEX(rentang_hst, '-', 1) AS UNSIGNED) AND CAST(SUBSTRING_INDEX(rentang_hst, '-', -1) AS UNSIGNED) LIMIT 1",
            [label_tanah_ai, hst_input]
        );

        if (rowsPakar.length === 0) {
            return res.status(404).json({ message: "Aturan hara tidak ditemukan untuk kondisi HST dan Tanah ini." });
        }
        
        const target = rowsPakar[0];

        // 4. Hitung Defisit Hara Total (Kg) sesuai Luas Lahan
        const defisitN = Math.max(0, (parseFloat(target.target_n) - parseFloat(n_input)) * luas);
        const defisitP = Math.max(0, (parseFloat(target.target_p) - parseFloat(p_input)) * luas);
        const defisitK = Math.max(0, (parseFloat(target.target_k) - parseFloat(k_input)) * luas);

        // 5. Ambil Semua Data Master Pupuk
        const [rowsPupuk] = await db.query("SELECT * FROM master_pupuk");

        // 6. LOGIKA FILTERING & RANKING
        let nitrogenList = [];
        let fosforList = [];
        let kaliumList = [];

        rowsPupuk.forEach(p => {
            // Grup Nitrogen
            if (defisitN > 0 && p.kadar_n_persen > 0) {
                nitrogenList.push({
                    id: p.id,
                    nama_pupuk: p.nama_pupuk,
                    kadar: p.kadar_n_persen,
                    defisit: defisitN,
                    harga_per_kg: p.harga_per_kg,
                    kadar_n_persen: p.kadar_n_persen,
                    kadar_p_persen: p.kadar_p_persen,
                    kadar_k_persen: p.kadar_k_persen
                });
            }

            // Grup Fosfor
            if (defisitP > 0 && p.kadar_p_persen > 0) {
                fosforList.push({
                    id: p.id,
                    nama_pupuk: p.nama_pupuk,
                    kadar: p.kadar_p_persen,
                    defisit: defisitP,
                    harga_per_kg: p.harga_per_kg,
                    kadar_n_persen: p.kadar_n_persen,
                    kadar_p_persen: p.kadar_p_persen,
                    kadar_k_persen: p.kadar_k_persen
                });
            }

            // Grup Kalium
            if (defisitK > 0 && p.kadar_k_persen > 0) {
                kaliumList.push({
                    id: p.id,
                    nama_pupuk: p.nama_pupuk,
                    kadar: p.kadar_k_persen,
                    defisit: defisitK,
                    harga_per_kg: p.harga_per_kg,
                    kadar_n_persen: p.kadar_n_persen,
                    kadar_p_persen: p.kadar_p_persen,
                    kadar_k_persen: p.kadar_k_persen
                });
            }
        });

        // Sorting: Rank tertinggi berdasarkan kadar tertinggi
        nitrogenList.sort((a, b) => b.kadar - a.kadar);
        fosforList.sort((a, b) => b.kadar - a.kadar);
        kaliumList.sort((a, b) => b.kadar - a.kadar);

        // 7. Simpan ke Tabel Riwayat Database Aiven (Menggunakan URL Cloudinary)
        const ringkasanText = `N:${defisitN.toFixed(1)}kg, P:${defisitP.toFixed(1)}kg, K:${defisitK.toFixed(1)}kg`;
        const queryRiwayat = `
            INSERT INTO riwayat (id_pengguna, jalur_foto, label_tanah_ai, n_input, p_input, k_input, hst_input, luas_lahan, rekomendasi_hasil) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // FIX: Kolom jalur_foto sekarang diisi oleh String URL Cloudinary permanen (finalImageUrl)
        await db.query(queryRiwayat, [
            id_user, 
            finalImageUrl, 
            label_tanah_ai, 
            n_input, p_input, k_input, hst_input, luas_lahan, 
            ringkasanText
        ]);

        // 8. Kirim Response JSON Sukses ke Flutter
        return res.json({
            status: "success",
            message: "[Success] Analisis Berhasil",
            data: {
                fase: target.nama_fase,
                jenis_tanah: label_tanah_ai,
                luas_lahan: luas,
                accuracy: accuracy_input,
                saran_pakar: target.saran_pakar,
                rekomendasi: {
                    nitrogen: nitrogenList,
                    fosfor: fosforList,
                    kalium: kaliumList
                },
                foto_tanah: finalImageUrl
            }
        });

    } catch (error) {

        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        logger.error(`[Rekomendasi Error] ${error.message}`);
        return res.status(500).json({ status: "error", message: error.message });
    }
};