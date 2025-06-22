import express, { Router } from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs'; 


const router = Router();


export const getUsr = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    try {
        console.log('in getuser in try')
        const user = await User.findById(id).populate('links');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            links: user.links.map(link => ({
                id: link._id,
                originalUrl: link.originalUrl,
                shortUrl: link.shortUrl
            }))
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const requestingUserId = req.user.id; // Get the ID of the authenticated user

    // SECURITY CHECK: Ensure user can only update their own account
    if (id !== requestingUserId) {
        return res.status(403).json({ error: 'Forbidden: You can only update your own account.' });
    }

    // You can make these fields optional in the body if you want partial updates.
    // But based on your 'all fields are required' check, we'll keep it for now.
    if (!id || !name || !email || !password) {
        return res.status(400).json({ error: 'User ID and all fields (name, email, password) are required' });
    }

    try {
        let updateFields = { name, email }; // Fields to be updated

        // HASH THE PASSWORD IF IT'S PROVIDED
        if (password) { // Only hash if a new password is provided in the request body
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt); // Store the HASHED password
        }

        // Find by ID and update the user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateFields, // <--- Use the 'updateFields' object here!
            { new: true, runValidators: true, context: 'query' }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found or you do not have access to it.' });
        }

        // IMPORTANT: Do NOT send the password back in the response
        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        // Handle specific errors like duplicate email
        if (error.code === 11000) { // MongoDB duplicate key error code
            return res.status(400).json({ error: 'Email is already registered.' });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid User ID format.' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    // THIS LINE DECLARES AND ASSIGNS 'requestingUserId'
    const requestingUserId = req.user.id;

    console.log('in deletelink befor !id'); // Fixed console log syntax (assuming this was your old log)

    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // IMPORTANT SECURITY CHECK:
    // This ensures a user can only delete their OWN account.
    // If you want an admin to delete other accounts, you'd need additional role-based logic here.
    if (id !== requestingUserId) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own account.' });
    }

    try {
        console.log('in deletelink in rty'); // Fixed console log syntax

        // Find and delete the user by their ID, ensuring it matches the requesting user's ID
        const deletedUser = await User.findByIdAndDelete({ _id: id }); // Simplified query, as ID match is already checked above

        if (!deletedUser) {
            // This should ideally not be hit if the ID check passes and the user exists.
            // It might mean the user ID was valid but the document wasn't found (e.g., already deleted).
            return res.status(404).json({ error: 'User not found.' });
        }

        // TODO: Optionally, implement cascading delete for links associated with this user
        // If you want to delete all links created by this user when the user is deleted,
        // you would add a line like:
        // await Link.deleteMany({ user: deletedUser._id });

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.log('in deletelink in catch '); // Fixed console log syntax

        console.error('Error deleting user:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid User ID format.' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};
// export const deleteUser = async (req, res) => {
//     const { id } = req.params;
//     if (!id) {
//         return res.status(400).json({ error: 'User ID is required' })
//     }
//      if (id !== requestingUserId) {
//         return res.status(403).json({ error: 'Forbidden: You can only delete your own account.' });
//     }
//     try {
//         const deletedUser = await User.findByIdAndDelete(id);
//         if (!deletedUser) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         return res.status(200).json({ message: 'User deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting user:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };



// export const updateUser = async (req, res) => {
//     const { id } = req.params;
//     const { name, email, password } = req.body;
//     const requestingUserId = req.user.id; // Get the ID of the authenticated user

//     if (id !== requestingUserId) {
//         return res.status(403).json({ error: 'Forbidden: You can only update your own account.' });
//     }
//     if (!id || !name || !email || !password) {
//         return res.status(400).json({ error: 'User ID and all fields are required' });
//     }

//     try {
//         const updatedUser = await User.findByIdAndUpdate( name, email);
//         if (!updatedUser) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         return res.status(200).json({
//             message: 'User updated successfully',
//             user: {
//                 id: updatedUser._id,
//                 name: updatedUser.name,
//                 email: updatedUser.email
//             }
//         });
//     } catch (error) {
//         console.error('Error updating user:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// }
