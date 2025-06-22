import User from '../models/User.js';


const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        console.log('in login in try')
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
         console.log('in login befor is match')
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }
                 console.log('in login befor token')
        const token = user.generateAuthToken();
                 console.log('in llogin after token before return 200')
        return res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
        });
    } catch (error) {
                 console.log('in login in catch')
        console.error('Error logging in:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


const registerUser = async (req, res) => {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
        console.log('in register befor try')

    try {
        const newUser = new User({
             userName,
            email,
            password
        });

        const savedUser = await newUser.save();
        const token = savedUser.generateAuthToken();
        console.log('in register before return 200')

        return res.status(201).json({
            message: 'User registered successfully',
            token:token,
            user: {
                id: savedUser._id,
                name: savedUser.userName,
                email: savedUser.email
            }
        });
    } catch (error) {
                console.log('in register before return error')
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export { registerUser, login };