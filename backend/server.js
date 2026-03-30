require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const lawyersRoutes = require('./routes/lawyers');
const aiRoutes = require('./routes/ai');
const reviewsRoutes = require('./routes/reviews');
const paymentsRoutes = require('./routes/payments');
const matchingRoutes = require('./routes/matching');
const documentsRoutes = require('./routes/documents');
const chatRoutes = require('./routes/chat');
const { initSocketServer } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

function isValidMongoUri(uri) {
  return typeof uri === 'string' && /^mongodb(\+srv)?:\/\//.test(uri);
}

if (!isValidMongoUri(mongoUri)) {
  console.error(
    'MONGO_URI is missing or invalid. Update backend/.env with a value that starts with mongodb:// or mongodb+srv://'
  );
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/lawyers', lawyersRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected');
    initSocketServer(server);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
