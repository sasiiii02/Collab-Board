import jwt from 'jsonwebtoken';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';

// Store who's online: { workspaceId: { socketId: { userId, username } } }
const onlineUsers = {};

// Middleware — verify JWT before allowing socket connection
export const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('No token'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch {
    return next(new Error('Invalid token'));
  }
};

export const registerSocketHandlers = (io, socket) => {

  // ─── JOIN WORKSPACE ROOM ──────────────────────────────────────
  socket.on('workspace:join', async ({ workspaceId }) => {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) return;

      // Check user is actually a member before letting them in
      const isMember = workspace.members.some(
        m => m.user.toString() === socket.user.id
      );
      if (!isMember) return;

      // Join the Socket.io room for this workspace
      socket.join(`workspace_${workspaceId}`);
      socket.currentWorkspace = workspaceId;

      // Track this user as online in this workspace
      if (!onlineUsers[workspaceId]) {
        onlineUsers[workspaceId] = {};
      }
      onlineUsers[workspaceId][socket.id] = {
        userId: socket.user.id,
        username: socket.user.username
      };

      // Tell everyone in the room who's now online
      io.to(`workspace_${workspaceId}`).emit(
        'presence:update',
        Object.values(onlineUsers[workspaceId])
      );

      console.log(`${socket.user.username} joined workspace ${workspaceId}`);
    } catch (err) {
      console.error('workspace:join error', err.message);
    }
  });

  // ─── TASK CREATED ─────────────────────────────────────────────
  // Frontend emits this after a successful POST /api/tasks
  // We just broadcast it to the room so everyone else sees the new card
  socket.on('task:create', ({ workspaceId, task }) => {
    socket.to(`workspace_${workspaceId}`).emit('task:created', task);
  });

  // ─── TASK MOVED (drag and drop) ───────────────────────────────
  socket.on('task:move', async ({ taskId, newStatus, newOrder, workspaceId }) => {
    try {
      const task = await Task.findByIdAndUpdate(
        taskId,
        { status: newStatus, order: newOrder },
        { new: true }
      )
        .populate('assignedTo', 'username avatar')
        .populate('createdBy', 'username');

      if (!task) return;

      // Broadcast updated task to everyone else in the room
      socket.to(`workspace_${workspaceId}`).emit('task:updated', task);
    } catch (err) {
      console.error('task:move error', err.message);
    }
  });

  // ─── TASK UPDATED (edit title, priority, etc) ─────────────────
  socket.on('task:update', ({ workspaceId, task }) => {
    socket.to(`workspace_${workspaceId}`).emit('task:updated', task);
  });

  // ─── TASK DELETED ─────────────────────────────────────────────
  socket.on('task:delete', ({ workspaceId, taskId }) => {
    socket.to(`workspace_${workspaceId}`).emit('task:deleted', taskId);
  });

  // ─── COMMENT ADDED ────────────────────────────────────────────
  socket.on('comment:add', ({ workspaceId, taskId, comment }) => {
    socket.to(`workspace_${workspaceId}`).emit('comment:added', {
      taskId,
      comment
    });
  });

  // ─── DISCONNECT ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    const workspaceId = socket.currentWorkspace;
    if (!workspaceId || !onlineUsers[workspaceId]) return;

    // Remove this socket from online users
    delete onlineUsers[workspaceId][socket.id];

    // Tell everyone remaining who's still online
    io.to(`workspace_${workspaceId}`).emit(
      'presence:update',
      Object.values(onlineUsers[workspaceId])
    );

    console.log(`${socket.user?.username} disconnected`);
  });
};