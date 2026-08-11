import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
  const authorization = req.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid authentication token' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

export default authMiddleware;
