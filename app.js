import express from 'express';
const app = express();
const port =process.env.PORT || 3000;
const connectDB = require('./config/db'); // Import the connectDB function

app.use(express.json());

app.get('/', (req,res)=>{
    res.send('welcome to TinyUrl API');
});


app.listen(PORT,()=>{
    console.log(`Server is running on port ${port}`);
})


connectDB(); // Call the connectDB function to establish a connection to the database