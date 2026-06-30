const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./config/logger');
require('dotenv').config();
const db = require('./config/db');


//Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const petaniRoutes = require('./routes/petaniRoutes');
const path = require('path');

const app = express();
// Middleware
app.use(morgan('combined', { 
    stream: { write: (message) => logger.info(message.trim()) } 
}));

app.use(cors()); 
app.use(express.json()); 

// Gunakan routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', petaniRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/soils', express.static(path.join(__dirname, 'uploads/soils')));



app.get('/', (req, res) => {
    res.json({ message: "API FertiScan (Main Backend Express.js) is running." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`[Success] Server FertiScan berjalan di port ${PORT}`);
});

module.exports = app;