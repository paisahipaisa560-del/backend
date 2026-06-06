require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bankRoutes = require('./routes/bankRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawRoutes = require('./routes/withdrawRoutes');
const gameRoutes = require('./routes/gameRoutes');
const referralRoutes = require('./routes/referralRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { GameEngine } = require('./utils/gameEngine');
const { query } = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean), credentials: true }
});

const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean), credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/payment-info', async (req, res) => {
  try {
    const result = await query('SELECT upi_id, qr_code FROM payment_settings LIMIT 1');
    if (result.rows.length > 0) {
      res.json({ success: true, data: result.rows[0] });
    } else {
      res.json({ success: false, message: 'Payment settings not configured' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment info' });
  }
});

const gameEngine = new GameEngine();
gameEngine.setIO(io);
app.locals.gameEngine = gameEngine;
gameEngine.startLoop();

io.on('connection', (socket) => {
  socket.emit('game:state', gameEngine.getState());
  socket.on('game:join', () => {
    socket.emit('game:state', gameEngine.getState());
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
