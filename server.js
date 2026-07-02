const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./config/logger'); // Pastikan logger.js sudah diubah ke Console Only
require('dotenv').config();
const db = require('./config/db');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const petaniRoutes = require('./routes/petaniRoutes');

const app = express();

// 1. Middleware Logging (Morgan) - Dioptimalkan untuk UptimeRobot
app.use(morgan('combined', { 
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req, res) => req.headers['user-agent']?.includes('UptimeRobot')
}));

// 2. Standard Middlewares
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 3. Folder Static (Hanya untuk file yang ada di repositori GitHub)
// Catatan: Foto yang baru diupload petani TIDAK AKAN tersimpan permanen di sini jika di Vercel
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/soils', express.static(path.join(__dirname, 'uploads/soils')));

// 4. Definisi Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', petaniRoutes);

// 5. Test Route
app.get('/', (req, res) => {
    res.json({ 
        status: "success",
        message: "API FertiScan Online & Running.",
        environment: process.env.NODE_ENV || "production"
    });
});

app.get('/api/ping', async (req, res) => {
    try {
        await db.query('SELECT 1'); // Query paling ringan di MySQL
        res.json({ status: "alive", db: "connected" });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 6. Handle 404 (Route tidak ditemukan)
app.use((req, res) => {
    res.status(404).json({ message: "Endpoint tidak ditemukan." });
});

// 7. Server Listener (Wajib untuk lokal, diabaikan otomatis oleh Vercel)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`[Success] Server berjalan di port ${PORT}`);
    });
}

// 8. EXPORT APP (Sangat Wajib untuk Vercel)
module.exports = app;
