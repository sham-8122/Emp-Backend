const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path'); // <--- THIS LINE WAS MISSING

const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Serve Uploaded Images Statically ---
// This allows the frontend to access images at http://localhost:5000/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// --- 404 Handler (Route Not Found) ---
app.use((req, res, next) => {
  res.status(404).json({ message: "The requested resource was not found." });
});

// --- Global Error Handler ---
app.use((error, req, res, next) => {
  console.error("🔥 GLOBAL ERROR HANDLER:", error.message);
  console.error(error.stack);
  
  res.status(500).json({ 
    message: "An unexpected error occurred on the server.",
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = app;