const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const animalRoutes = require('./routes/animalRoutes');
const clientRoutes = require('./routes/clientRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static frontend files (Production)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/animales', animalRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/sanidad', require('./routes/healthRoutes'));
app.use('/api/ovinos', require('./routes/ovineRoutes'));
app.use('/api/gastos', require('./routes/expenseRoutes'));

// Database connection check (Optional - removed to prevent crash on offline mode)
/*
const db = require('./config/db');
db.getConnection()
    .then(connection => {
        console.log('Connected to Database');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to Database:', err);
    });
*/

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
