const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function reset() {
    console.log("--- Memulai Reset Database FertiScan ---");

    try {
        // 1. Matikan Foreign Key Check agar bisa Drop Tabel dengan aman
        await db.query("SET FOREIGN_KEY_CHECKS = 0");

        // 2. Hapus Tabel Jika Ada
        console.log("Menghapus tabel lama...");
        await db.query("DROP TABLE IF EXISTS riwayat");
        await db.query("DROP TABLE IF EXISTS pakar_hara");
        await db.query("DROP TABLE IF EXISTS master_pupuk");
        await db.query("DROP TABLE IF EXISTS pengguna");

        // 3. Buat Kembali Tabel (Sesuai Spesifikasi Terakhir)
        console.log("Membangun ulang struktur tabel...");
        
        await db.query(`
            CREATE TABLE pengguna (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                no_whatsapp VARCHAR(20),
                role ENUM('Petani', 'Admin') DEFAULT 'Petani',
                tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE master_pupuk (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_pupuk VARCHAR(50) NOT NULL,
                kadar_n_persen FLOAT DEFAULT 0,
                kadar_p_persen FLOAT DEFAULT 0,
                kadar_k_persen FLOAT DEFAULT 0,
                harga_per_kg DECIMAL(10, 2) NOT NULL
            )
        `);

        await db.query(`
            CREATE TABLE pakar_hara (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rentang_hst VARCHAR(20) NOT NULL,
                target_n FLOAT NOT NULL,
                target_p FLOAT NOT NULL,
                target_k FLOAT NOT NULL,
                saran_pakar TEXT
            )
        `);

        await db.query(`
            CREATE TABLE riwayat (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_pengguna INT,
                label_tanah_ai VARCHAR(50),
                n_input FLOAT,
                p_input FLOAT,
                k_input FLOAT,
                hst_input INT,
                rekomendasi_hasil TEXT,
                tanggal_simpan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE CASCADE
            )
        `);

        // 4. SEEDING DATA (Mengisi Data Awal Otomatis)
        console.log("Mengisi data awal (Seeding)...");

        // admin default
        const passAdmin = await bcrypt.hash('admin123', 10);
        await db.query(
            "INSERT INTO pengguna (nama, email, password, no_whatsapp, role) VALUES (?, ?, ?, ?, ?)",
            ['Mitra Kios Pupuk', 'admin@gmail.com', passAdmin, '6281537559347', 'Admin']
        );


        await db.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("=== Database Berhasil Di-reset & Di-isi! ===");
        process.exit();

    } catch (error) {
        console.error("[Error] Gagal reset database:", error);
        process.exit(1);
    }
}

reset();