import { Router } from 'express';
import { login, registerUser } from '../controllers/authController.js';
import {
  createAuthenticatedShortLink,
  deleteLink,
  getAllLinks,
  getClicksOfLink,
  getClicksOfLinkBySource,
  getDetailsLinkById,
} from '../controllers/linkController.js';
import { deleteUser, getUsr, updateUser } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post('/auth/register', registerUser);
router.post('/auth/login', login);
router.get('/users/:id', authMiddleware, getUsr);
router.patch('/users/:id', authMiddleware, updateUser);
router.delete('/users/:id', authMiddleware, deleteUser);
router.post('/links', authMiddleware, createAuthenticatedShortLink);
router.get('/links', authMiddleware, getAllLinks);
router.get('/links/:id', authMiddleware, getDetailsLinkById);
router.delete('/links/:id', authMiddleware, deleteLink);
router.get('/links/:id/clicks', authMiddleware, getClicksOfLink);
router.get('/links/:id/clicks/by-source', authMiddleware, getClicksOfLinkBySource);

export default router;
