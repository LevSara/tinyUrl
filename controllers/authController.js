import User from '../models/User.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const login = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const { password } = req.body;
  if (!EMAIL_PATTERN.test(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'A valid email and password are required' });
  }
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.status(200).json({
      message: 'Login successful',
      token: user.generateAuthToken(),
      user: { id: user._id, userName: user.userName, email: user.email },
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerUser = async (req, res) => {
  const userName = typeof req.body.userName === 'string' ? req.body.userName.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const { password } = req.body;
  if (userName.length < 2 || userName.length > 50 || !EMAIL_PATTERN.test(email) || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'userName (2-50 characters), a valid email, and password (at least 8 characters) are required' });
  }
  try {
    const user = await User.create({ userName, email, password });
    return res.status(201).json({
      message: 'User registered successfully',
      token: user.generateAuthToken(),
      user: { id: user._id, userName: user.userName, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'The username or email is already registered' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
