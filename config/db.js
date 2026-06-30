const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Mengambil file ca.pem dari root project
const caPath = path.join(process.cwd(), 'ca.pem');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        ca: fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined,
    },
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = db;
