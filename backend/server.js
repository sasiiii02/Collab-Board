import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import taskRoutes from './routes/tasks.js';
import { socketAuth, registerSocketHandlers } from './socket/handlers.js';


dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io needs the HTTP server, not just express
// This is because WebSocket upgrades happen at HTTP level
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
io.use(socketAuth);

// Routes (we'll add these one by one)
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/tasks', taskRoutes);

// Basic health check — test this in browser first
app.get('/', (req, res) => {
  res.json({ message: 'CollabBoard API is running' });
});

// Register all events for each connected socket
io.on('connection', (socket) => {
  console.log('User connected:', socket.user?.username);
  registerSocketHandlers(io, socket);
});

// Connect to MongoDB then start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));

export { io };