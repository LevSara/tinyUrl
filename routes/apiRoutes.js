// routes/apiRoutes.js
import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js'; // Assuming authMiddleware.js exports a default or named 'protect'
import { // Import specific named exports from linkController.js for authenticated API
    createShortLink, // If you want an authenticated version too (POST /api/links)
    getDetailsLinkById,
    updateLink,
    deleteLink,
    getAllLinks,
    getClicksOfLink,
    createShortLinkWithSource,
    getClicksOfLinkBySource // Corrected typo here
} from '../controllers/linkController.js';
import { registerUser, login } from '../controllers/authController.js'; 
import { getUsr, updateUser, deleteUser } from '../controllers/userController.js'; 
const router = Router();

// AUTH ROUTES (usually no protection needed for register/login themselves)
router.post('/auth/register', registerUser); // POST - register a new user
router.post('/auth/login', login); // POST - login a user

// USER ROUTES (Require authentication)
router.get('/users/:id', authMiddleware, getUsr);    // GET - Get user details by ID
router.put('/users/:id', authMiddleware, updateUser); // PUT - Update user by ID
router.delete('/users/:id', authMiddleware, deleteUser); // DELETE - Delete user by ID

// LINK ROUTES 


router.post('/auth/user', authMiddleware, createShortLinkWithSource); // POST - create a new short link with source just for an authenticated user
router.get('/links', authMiddleware, getAllLinks); // GET - get all links for the authenticated user
router.get('/links/:id', authMiddleware, getDetailsLinkById); // GET - get details of specific link by ID
router.put('/links/:id', authMiddleware, updateLink); // PUT - update a specific link by ID of link
router.patch('/links/:id', authMiddleware, updateLink); // PATCH - update a specific link by ID (partial update)
router.delete('/links/:id', authMiddleware, deleteLink); // DELETE - delete a specific link by ID

// Click tracking routes (authenticated access to click data)
router.get('/links/:id/clicks', authMiddleware, getClicksOfLink);
router.get('/links/:id/clicks/bySource', authMiddleware, getClicksOfLinkBySource); // Corrected typo here

export default router;

// import  express,{Router}  from 'express'; // Import Router from express to create a new router instance
// import authMiddleware from '../middleware/authMiddleware.js'; // Import the authentication middleware
// import {    createShortLink,
//     redirectToOriginalUrl,
//     getDetailsLinkById,
//     updateLink,
//     deleteLink,
//     getAllLinks,
//     getClicksOfLink,
//     createShortLinkWithSource,
//     getClicksOLinkBySource} from '../controllers/linkController.js'; // Import the link controller for handling link-related operations
// import { registerUser, loginUser } from '../controllers/authController.js';

// const router = Router();

// // AUTH ROUTES
// router.post('/auth/register',registerUser); //POST - register a new user
// router.post('/auth/login', loginUser); // POST - login a user

// // LINK ROUTESrouter.post('/links', createShortLink);// Route to create a new short link
// router.post('/auth/user', authMiddleware, createShortLinkWithSource);//POST - create a new short link with source just for the authenticated user
// // router.get('auth/user/:id/links', authMiddleware, getAllLinks);// GET - get all links for the authenticated user
// // router.get('user/:id/links/:llinkId', authMiddleware, getDetailsLinkById); // GET - get details of specific link by ID
// // router.put('/links/:id', authMiddleware, updateLink); //PUT - update a specific link by ID of link
// // router.delete('/links/:id', authMiddleware, deleteLink);// DELETE - delete a specific link by ID
// router.get('/links', authMiddleware, getAllLinks); // Get all links for a user
// router.get('/links/:id', authMiddleware, getDetailsLinkById); // Get details of a specific link
// router.put('/links/:id', authMiddleware, updateLink); // Update a link (full replacement)
// router.patch('/links/:id', authMiddleware, updateLink); // Update a link (partial update)
// router.delete('/links/:id', authMiddleware,deleteLink); // Delete a link

// // Click tracking routes
// router.get('/links/:id/clicks', authMiddleware, getClicksOfLink);
// router.get('/links/:id/clicks/bySource', authMiddleware, getClicksOLinkBySource); // Check your typo "OLink"

// export default router;