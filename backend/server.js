const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
require('dotenv').config();

const { initDb } = require('./models/db');

// Routes
const authRoutes         = require('./routes/auth');
const employeesRoutes    = require('./routes/employees');
const salesRoutes        = require('./routes/sales');
const inventoryRoutes    = require('./routes/inventory');
const shiftsRoutes       = require('./routes/shifts');
const messagesRoutes     = require('./routes/messages');
const invoicesRoutes     = require('./routes/invoices');
const institutionsRoutes = require('./routes/institutions');
const payrollRoutes      = require('./routes/payroll');

// ── Init database ────────────────────────────────────────────
initDb();

// ── Express app ──────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Mount routes
app.use('/api/auth',         authRoutes);
app.use('/api/employees',    employeesRoutes);
app.use('/api/sales',        salesRoutes);
app.use('/api/inventory',    inventoryRoutes);
app.use('/api/shifts',       shiftsRoutes);
app.use('/api/messages',     messagesRoutes);
app.use('/api/invoices',     invoicesRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/payroll',      payrollRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── HTTP + Socket.IO server ──────────────────────────────────
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

// Socket.IO — real-time messaging
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded  = jwt.verify(token, process.env.JWT_SECRET);
    socket.user    = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 ${socket.user.username} (${socket.user.role}) connected`);
  socket.join(`user_${socket.user.id}`);
  if (socket.user.role === 'manager') socket.join('managers');

  // Send a private message
  socket.on('send_message', ({ receiver_id, content }) => {
    if (!content?.trim()) return;
    const msg = {
      sender_id:      socket.user.id,
      sender_name:    socket.user.username,
      receiver_id:    receiver_id || null,
      content:        content.trim(),
      created_at:     new Date().toISOString(),
    };
    if (receiver_id) {
      io.to(`user_${receiver_id}`).emit('new_message', msg);
    } else {
      io.to('managers').emit('new_message', msg);  // broadcast to manager(s)
    }
    socket.emit('message_sent', msg);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 ${socket.user.username} disconnected`);
  });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Gas Station API running on http://localhost:${PORT}`);
  console.log(`   Manager login: admin / Admin@1234\n`);
});
