import express from 'express';
const app = express();
const port =process.env.PORT || 3000;
const connectDB = require('./config/db'); // Import the connectDB function

app.use(express.json());
connectDB(); // Call the connectDB function to establish a connection to the database

app.get('/', (req,res)=>{
    res.send('welcome to TinyUrl API');
});


app.listen(PORT,()=>{
    console.log(`Server is running on port ${port}`);
})

//func to get shortUrl 
app.get('/links/:id', (req, res) => {
 res.json({
        id: req.params.id,
        //to add guard or wahtever to check if the id is valid
        originalUrl: '',
        //where to get original url from?
        shortUrl: `${req.protocol}://${req.get('host')}/${req.params.id}`   
 //to add protocol

    })
    
});
//func to get all links of a user
app.get('/users/:id/links', (req, res) => {
    //to add guard or whatever to check if the id is valid
    res.json({
        id: req.params.id,
        links: [] // This should be replaced with actual links fetched from the database
    });
});

//func to get the clicks of the
