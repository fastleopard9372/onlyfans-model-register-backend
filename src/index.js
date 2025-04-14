require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const setupSocket = require('./socket/chat');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');

// Initialize express app
const app = express();
// Connect to MongoDB
connectDB();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
// Use morgan in development mode with the 'dev' format
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Use a more concise format in production
  app.use(morgan('combined'));
}

// Root route handler
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../dist/index.html'));
// });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));

app.use('/api/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // 👈 crucial line
  }
}));

const server = http.createServer(app);
setupSocket(server);

app.use('/api', routes);
app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});





module.exports = app;
