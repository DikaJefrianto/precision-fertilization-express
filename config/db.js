const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Gunakan process.cwd() agar Vercel mencari dari root folder
const caCertPath = path.join(process.cwd(), 'ca.pem');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        // Baca file ca.pem dengan cara yang aman untuk cloud
        ca: fs.readFileSync(caCertPath),
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tes koneksi saat server startup (Lihat di log Vercel)
db.getConnection()
    .then(conn => {
        console.log("SUKSES: Terhubung ke database Aiven!");
        conn.release();
    })
    .catch(err => {
        console.error("GAGAL: Koneksi database bermasalah:", err.message);
    });

module.exports = db;