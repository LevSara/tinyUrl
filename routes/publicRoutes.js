import { Router } from 'express';
import { createShortLink, redirectToOriginalUrl } from '../controllers/linkController.js';

const router = Router();

router.post('/links', createShortLink);
router.get('/:shortCode', redirectToOriginalUrl);

export default router;
