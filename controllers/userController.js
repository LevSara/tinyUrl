import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import Link from '../models/Link.js';
import User from '../models/User.js';

const ownsAccount = (req) => req.params.id === req.user.id;

export const getUsr = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  if (!ownsAccount(req)) {
    return res.status(403).json({ error: 'You can only access your own account' });
  }
  try {
    const user = await User.findById(req.params.id).populate('links');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      id: user._id,
      userName: user.userName,
      email: user.email,
      links: user.links,
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  if (!ownsAccount(req)) {
    return res.status(403).json({ error: 'You can only update your own account' });
  }

  try {
    const updates = {};
    if (typeof req.body.userName === 'string' && req.body.userName.trim()) updates.userName = req.body.userName.trim();
    if (typeof req.body.email === 'string' && req.body.email.trim()) updates.email = req.body.email.trim().toLowerCase();
    if (req.body.password !== undefined) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
        return res.status(400).json({ error: 'password must contain at least 8 characters' });
      }
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one supported field is required' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({
      message: 'User updated successfully',
      user: { id: user._id, userName: user.userName, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'The username or email is already registered' });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid user ID' });
  if (!ownsAccount(req)) return res.status(403).json({ error: 'You can only delete your own account' });
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await Link.deleteMany({ user: user._id });
    return res.status(200).json({ message: 'User and associated links deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
