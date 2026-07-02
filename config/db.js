const mysql = require('mysql2/promise');
require('dotenv').config();

const dbUrl = new URL(process.env.DATABASE_URL);

const db = mysql.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: 'fertiscan_db',
    ssl: {
        rejectUnauthorized: false 
    },
    waitForConnections: true,
    connectionLimit: 5, 
    connectTimeout: 20000 
});

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
