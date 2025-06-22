// routes/publicRoutes.js
import { Router } from 'express';
// Import specific named exports from linkController.js that are public-facing
import { createShortLink, redirectToOriginalUrl } from '../controllers/linkController.js';

const router = Router();

// Route to allow public creation of short links (if desired at the root path, e.g., POST /links)
// This will be accessible at http://localhost:3000/links if mounted at '/' in index.js
// If you want all link creation to be authenticated, remove this route from here.
router.post('/links', createShortLink);

// Route to redirect short codes (e.g., http://localhost:3000/my-doc-link)
router.get('/:shortCode', redirectToOriginalUrl);

export default router;