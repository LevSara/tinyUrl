const express = require('express');
const router = express.Router();
const User = require('../models/User.js'); 


const getUsr = async (req, res) => {const { id } = req.params;
if(!id) {
    return res.status(400).json({ error: 'User ID is required' });
}
try {
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
            shortUrl: `${req.protocol}://${req.get('host')}/${link._id}`
        }))
    });
} catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Internal server error' });
}};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!id || !name || !email || !password) {
        return res.status(400).json({ error: 'User ID and all fields are required' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(id, { name, email, password }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
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
        return res.status(500).json({ error: 'Internal server error' });
    }
}


const deleteUser = async (req, res) => {
    const{id} = req.params;
    if(!id){
        return res.status(400).json({error: 'User ID is required'})
    }
    try{
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
}};


