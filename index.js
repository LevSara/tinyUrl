import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express from 'express';
import apiRoutes from './routes/apiRoutes.js'; 
import publicRoutes from './routes/publicRoutes.js'; 
import connectDB from './config/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Corrected 'extended' and ensured it's not 'urlencode'
connectDB(); // Call the connectDB function to establish a connection to the database

// Basic welcome route for the root
app.get('/', (req, res) => {
    res.send('welcome to TinyUrl API');
});

// Mount public routes (like short URL redirects and optional public link creation)
// This should come before /api routes if some public routes have generic paths like /:shortCode
app.use('/', publicRoutes);

// Mount API routes (all authenticated API endpoints)
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Existing /users/:id/links route (if this is for a general path and not part of /api)
app.get('/users/:id/links', (req, res) => {
    // to add guard or whatever to check if the id is valid
    res.json({
        id: req.params.id,
        links: [] // This should be replaced with actual links fetched from the database
    });
});

// The incomplete line comment can be removed if not in use.
// func to get the clicks of the
// import dotenv from 'dotenv';
// dotenv.config(); // Load environment variables from .env file

// import express from 'express';
// import linkRoutes from './routes/apiRoutes.js'
// import connectDB from './config/db.js'; 

// const app = express();
// const PORT =process.env.PORT || 3000;

// app.use(express.json());
// app.use(express.urlencoded({extend:true}));
// connectDB(); // Call the connectDB function to establish a connection to the database

// app.get('/', (req,res)=>{
//     res.send('welcome to TinyUrl API');
// });

// app.use('/api', linkRoutes)
// app.listen(PORT,()=>{
//     console.log(`Server is running on port ${PORT}`);
// })

// //func to get shortUrl 
// app.get('/links/:id', (req, res) => {
//  res.json({
//         id: req.params.id,
//         //to add guard or wahtever to check if the id is valid
//         originalUrl: '',
//         //where to get original url from?
//         shortUrl: `${req.protocol}://${req.get('host')}/${req.params.id}`   
//  //to add protocol

//     })
    
// });
// //func to get all links of a user
// app.get('/users/:id/links', (req, res) => {
//     //to add guard or whatever to check if the id is valid
//     res.json({
//         id: req.params.id,
//         links: [] // This should be replaced with actual links fetched from the database
//     });
// });

// //func to get the clicks of the
