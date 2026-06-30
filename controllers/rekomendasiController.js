const db = require('../config/db');
const logger = require('../config/logger');

exports.hitungDosisPresisi = async (req, res) => {
    // accuracy_input dikirim dari Flutter hasil tangkapan scan Flask sebelumnya
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
    const nama_file_foto = req.file ? req.file.filename : null;

    try {
        // Log untuk memantau apakah akurasi masuk ke Express.js
        console.log(`[DEBUG] Accuracy received from Flutter: ${accuracy_input}`);
        logger.info(`[Expert System] Menghitung dosis untuk User: ${id_user}, Tanah: ${label_tanah_ai}`);

        const luas = parseFloat(luas_lahan) || 1;

        // 1. Ambil Target Hara dari Pakar berdasarkan Label Tanah dan HST
        // Logika SUBSTRING_INDEX digunakan untuk membedah rentang hst (misal '0-20')
        const [rowsPakar] = await db.query(
            "SELECT * FROM pakar_hara WHERE label_tanah = ? AND ? BETWEEN CAST(SUBSTRING_INDEX(rentang_hst, '-', 1) AS UNSIGNED) AND CAST(SUBSTRING_INDEX(rentang_hst, '-', -1) AS UNSIGNED) LIMIT 1",
            [label_tanah_ai, hst_input]
        );

        if (rowsPakar.length === 0) {
            return res.status(404).json({ message: "Aturan hara tidak ditemukan untuk kondisi HST dan Tanah ini." });
        }
        
        const target = rowsPakar[0];

        // 2. Hitung Defisit Hara Total (Kg) sesuai Luas Lahan
        // Defisit = (Target Standar - Input User) * Luas Lahan
        const defisitN = Math.max(0, (parseFloat(target.target_n) - parseFloat(n_input)) * luas);
        const defisitP = Math.max(0, (parseFloat(target.target_p) - parseFloat(p_input)) * luas);
        const defisitK = Math.max(0, (parseFloat(target.target_k) - parseFloat(k_input)) * luas);

        // 3. Ambil Semua Data Master Pupuk
        const [rowsPupuk] = await db.query("SELECT * FROM master_pupuk");

        // 4. LOGIKA FILTERING & RANKING (Berdasarkan Kolom Database Anda)
        let nitrogenList = [];
        let fosforList = [];
        let kaliumList = [];

        rowsPupuk.forEach(p => {
            // Cek ketersediaan unsur hara di tiap pupuk
            // Kadar murni diambil dari kolom: kadar_n_persen, kadar_p_persen, kadar_k_persen
            
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

        // Sorting: Rank 1 adalah pupuk dengan kadar tertinggi (Paling Efisien)
        nitrogenList.sort((a, b) => b.kadar - a.kadar);
        fosforList.sort((a, b) => b.kadar - a.kadar);
        kaliumList.sort((a, b) => b.kadar - a.kadar);

        // 5. Simpan ke Tabel Riwayat
        const ringkasanText = `N:${defisitN.toFixed(1)}kg, P:${defisitP.toFixed(1)}kg, K:${defisitK.toFixed(1)}kg`;
        const queryRiwayat = `
            INSERT INTO riwayat (id_pengguna, jalur_foto, label_tanah_ai, n_input, p_input, k_input, hst_input, luas_lahan, rekomendasi_hasil) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(queryRiwayat, [
            id_user, 
            nama_file_foto, 
            label_tanah_ai, 
            n_input, p_input, k_input, hst_input, luas_lahan, 
            ringkasanText
        ]);

        // 6. Kirim Response JSON
        res.json({
            status: "success",
            message: "[Success] Analisis Berhasil",
            data: {
                fase: target.nama_fase,
                jenis_tanah: label_tanah_ai,
                luas_lahan: luas,
                accuracy: accuracy_input, // Mengirimkan nilai murni dari Flutter
                saran_pakar: target.saran_pakar,
                rekomendasi: {
                    nitrogen: nitrogenList,
                    fosfor: fosforList,
                    kalium: kaliumList
                },
                foto_tanah: nama_file_foto
            }
        });

    } catch (error) {
        logger.error(`[Rekomendasi Error] ${error.message}`);
        res.status(500).json({ status: "error", message: error.message });
    }
};