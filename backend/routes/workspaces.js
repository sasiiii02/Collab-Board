import express from 'express';
import crypto from 'crypto';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// POST /api/workspaces — create a new workspace
router.post('/', protect, async (req, res) => {
  const { name, description } = req.body;
  try {
    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      inviteToken: crypto.randomBytes(16).toString('hex')
    });

    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workspaces — get all workspaces the logged-in user belongs to
router.get('/', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('owner', 'username email');

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workspaces/:id — get one workspace with members populated
router.get('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('members.user', 'username email avatar');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if requester is a member
    const isMember = workspace.members.some(
      m => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workspaces/join/:token — join via invite link
router.post('/join/:token', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      inviteToken: req.params.token
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Invalid invite link' });
    }

    // Check if already a member
    const alreadyMember = workspace.members.some(
      m => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'Already a member' });
    }

    workspace.members.push({ user: req.user._id, role: 'editor' });
    await workspace.save();

    res.json({ message: 'Joined workspace', workspace });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;