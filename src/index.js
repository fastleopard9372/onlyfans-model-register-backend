require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
// Import routes
const {
  authRoutes,
  paymentRoutes,
  donationRoutes,
  userRoutes,
  photoRoutes,
  uploadRoutes,
  downloadRoutes
} = require('./routes');
// Initialize express app
const app = express();

// Serve static files from uploads directory
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/donation', donationRoutes);
app.use('/api/download/uploads', downloadRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
