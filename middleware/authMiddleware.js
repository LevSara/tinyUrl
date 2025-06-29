import pkg from 'jsonwebtoken';
const { verify} = pkg;
import User from '../models/User.js';


const authMiddleware = async (req, res, next) => {
    if (!req.headers.authorization||!req.headers.authorization.startsWith('Bearer ')) {       
        return res.status(401).json({ error: 'Unauthorized access, token missing' });
    }
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        //is it possible to have a token without the Bearer prefix?
        //is it poosible to have a request without the Authorization header?
        //or without the token? how? isnt it like a must?
        return res.status(401).json({ error: 'Unauthorized access, token missing' });
    }
    try {
        //verify the token
        const decode = verify(token, process.env.JWT_SECRET);
        if (!decode || !decode.id) {
            return res.status(401).json({ error: 'Unauthorized access, invalid information' });
        }

        //find the user by ID from the decoded token
        const user = await User.findById(decode.id);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized access, invalid token or user' });
            //better to write the error message more broadler, for security reasons
        }
        // Attach the user to the request object for further use in the route handlers
        req.user = user;
        next(); // Call the next middleware or route handler
    } catch (error) {
        console.log('Error in authMiddleware:', error);
          if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized access, token expired' });
        }
        return res.status(401).json({ error: 'Unauthorized access, invalid token' });
    }
}
export default authMiddleware;
