import express from 'express';
import Task from '../models/Task.js';
import Workspace from '../models/Workspace.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Helper — check if user is member of workspace and return their role
const getMemberRole = (workspace, userId) => {
  const member = workspace.members.find(
    m => m.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// GET /api/tasks/:workspaceId — get all tasks for a workspace
router.get('/:workspaceId', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const role = getMemberRole(workspace, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ workspace: req.params.workspaceId })
      .populate('assignedTo', 'username avatar')
      .populate('createdBy', 'username')
      .populate('comments.user', 'username avatar')
      .sort({ order: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:workspaceId — create a task
router.post('/:workspaceId', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const role = getMemberRole(workspace, req.user._id);
    if (!role || role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot create tasks' });
    }

    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    // Put new task at the end of its column
    const lastTask = await Task.findOne({
      workspace: req.params.workspaceId,
      status: status || 'todo'
    }).sort({ order: -1 });

    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      workspace: req.params.workspaceId,
      createdBy: req.user._id,
      order
    });

    // Populate before sending back
    const populated = await task.populate([
      { path: 'assignedTo', select: 'username avatar' },
      { path: 'createdBy', select: 'username' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id — update a task (title, status, priority, etc)
router.patch('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const workspace = await Workspace.findById(task.workspace);
    const role = getMemberRole(workspace, req.user._id);
    if (!role || role === 'viewer') {
      return res.status(403).json({ message: 'Viewers cannot edit tasks' });
    }

    const allowed = ['title', 'description', 'status', 'priority', 'assignedTo', 'dueDate', 'order'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    const populated = await task.populate([
      { path: 'assignedTo', select: 'username avatar' },
      { path: 'createdBy', select: 'username' },
      { path: 'comments.user', select: 'username avatar' }
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const workspace = await Workspace.findById(task.workspace);
    const role = getMemberRole(workspace, req.user._id);

    // Only admin or the creator can delete
    if (role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks/:id/comments — add a comment
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const workspace = await Workspace.findById(task.workspace);
    const role = getMemberRole(workspace, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();

    const populated = await task.populate('comments.user', 'username avatar');
    res.status(201).json(populated.comments.at(-1));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;