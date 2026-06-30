const mysql = require('mysql2/promise');

// Inisialisasi pool menggunakan Service URI
const db = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        // Abaikan pengecekan file fisik ca.pem, biarkan driver mysql2 
        // melakukan negosiasi SSL otomatis dengan Aiven
        rejectUnauthorized: false 
    },
    waitForConnections: true,
    connectionLimit: 5, // Kurangi limit untuk serverless agar tidak overload
    connectTimeout: 20000 // Naikkan ke 20 detik untuk kompensasi jarak server
});

// TEST KONEKSI SECARA LANGSUNG (Hasilnya bisa dilihat di log Vercel)
db.getConnection()
    .then(conn => {
        console.log("== KONEKSI DATABASE BERHASIL! ==");
        conn.release();
    })
    .catch(err => {
        console.error("== KONEKSI DATABASE GAGAL! == Error:", err.message);
    });

module.exports = db;
