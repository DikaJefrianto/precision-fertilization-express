const mysql = require('mysql2/promise');
require('dotenv').config();

// CRITICAL FIX: mysql2 tidak membaca properti { uri: ... } di dalam objek.
// Kita breakdown DATABASE_URL menggunakan URL parser bawaan Node.js.
const dbUrl = new URL(process.env.DATABASE_URL);

const db = mysql.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: 'fertiscan_db',
    ssl: {
        // Negosiasi SSL otomatis dengan Aiven tanpa file fisik ca.pem
        rejectUnauthorized: false 
    },
    waitForConnections: true,
    connectionLimit: 5, // Sudah sangat pas untuk arsitektur serverless
    connectTimeout: 20000 // CRITICAL FIX: 20000 ms = 20 detik (sebelumnya 100 ms = 0.1 detik)
});

// CRITICAL EFFICIENCY: Jalankan test koneksi langsung hanya di komputer lokal (Development).
// Di Vercel (Production), kita hindari ini untuk menghemat performa Cold Start.
if (process.env.NODE_ENV !== 'production') {
    db.getConnection()
        .then(conn => {
            console.log("== [LOKAL] KONEKSI DATABASE AIVEN BERHASIL! ==");
            conn.release();
        })
        .catch(err => {
            console.error("== [LOKAL] KONEKSI DATABASE GAGAL! == Error:", err.message);
        });
}

module.exports = db;
