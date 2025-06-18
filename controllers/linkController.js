const { nanoid } = require('nanoid');
const User = require('../models/User.js');
const Link = require('../models/Link.js');
const { generateUniqueShortUrl } = require('../utils/urlGenerator.js');
const createShortLink = async (req, res) => {
    const { originalUrl } = req.body;
    if (!originalUrl) {
        return res.status(400).json({ error: 'Original URL is required' });
    }
    try {
        //generate a unique short URL using nanoid
        const shortCode = await generateUniqueShortUrl(); // call to the function generates a unique short URL

        //create an instance of the Link model in mongoose
        const newLink = new Link({
            originalUrl: originalUrl,
            shortUrl: shortCode, // Generate a unique short URL using nanoid
        })

        //to save the new link to the database
        const savedLink = await newLink.save();
        // Construct the full short URL
        const fullShortUrl = `${req.protocol}://${req.get('host')}/${savedLink.shortUrl}`;
        // Return the response with the saved link details
        return res.status(201).json({
            message: 'Link created successfully',
            link: {
                id: savedLink._id,
                originalUrl: savedLink.originalUrl,
                shortUrl: fullShortUrl
            }
        });
    } catch (error) {
        // MongoDB unique index error (E11000) for shortUrl
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Failed to generate a unique short URL after multiple attempts. Please try again.' });
        }
        console.error('Error creating link:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
//V
const redirectToOriginalUrl = async (req, res) => {
    const { shortCode } = req.params;
    if (!shortCode) {
        return res.status(400).json({ error: 'Short code is required' });
    }
    try {
        // Find the link by short URL
        const link = await Link.findOne({ shortUrl: shortCode });

        if (!link) {
            return res.status(404).json({ error: 'short URL not found' });
        }

        //tracking the clicks
        // Increment the click count
        link.numOfClicks += 1;
       const incomingSource = req.query.s || link.source ||'direct'; // Get the source from query params or use the link's source
        const currentClicksOfSource = link.clicksBySource.get(incomingSource) || 0; // Get current clicks for the source or default to 0
        link.clicksBySource.set(incomingSource, currentClicksOfSource + 1); // Increment clicks for the source 

        await link.save();//save the updated link with incremented clicks
        // Redirect to the original URL
        return res.redirect(link.originalUrl);
    } catch (error) {
        console.error('Error redirecting to original URL:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

//V
const getDetailsLinkById = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
    }
    return Link.findById(id)
        .then(link => {
            if (!link) {
                return res.status(404).json({ error: 'Link not found' });
            }
            return res.status(200).json({
                id: link._id,
                originalUrl: link.originalUrl,
                shortUrl: `${req.protocol}://${req.get('host')}/${link._id}`,
                source: link.source || 'default', // Assuming source is a field in the Link model
                clicks: link.clicks || 0 // Assuming clicks is a field in the Link model
            });
        })
        .catch(error => {
            console.error('Error fetching link:', error);
            return res.status(500).json({ error: 'Internal server error' });
        })
};

//V
const updateLink = async (req, res) => {
    const { id } = req.params;
    const { originalUrl } = req.body;
    if (!id || !originalUrl) {
        return res.status(400).json({ error: 'Link ID and original URL are required' });
    } return Link.findByIdAndUpdate(id, originalUrl, { new: true })
        .then(link => {
            if (!link) {
                return res.status(404).json({ error: 'Link not found' });
            }
            return res.status(200).json({
                message: 'Link updated successfully',
                link: {
                    id: link._id,
                    originalUrl: link.originalUrl,
                    shortUrl: `${req.protocol}://${req.get('host')}/${link._id}`
                }
            });
        })
        .catch(error => {
            console.error('Error updating link:', error);
            return res.status(500).json({ error: 'Internal server error' });
        })
}

//V
const deleteLink = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
    } return Link.findByIdAndDelete(id)
        .then(link => {
            if (!link) {
                return res.status(404).json({ error: 'Link not found' });
            }
            return res.status(200).json({ message: 'Link deleted successfully' });
        })
        .catch(error => {
            console.error('Error deleting link:', error);
            return res.status(500).json({ error: 'Internal server error' });
        })
}


//what is wrong with this function? what is the logic of it?
const getAllLinks = async (req, res) => {
    return Link.find()
}

const addLinkToUser = async (req, res) => {
    const { userId, linkId } = req.body;

    if (!userId || !linkId) {
        return res.status(400).json({ error: 'User ID and Link ID are required' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.links.push(linkId);
        await user.save();

        return res.status(200).json({
            message: 'Link added to user successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                links: user.links
            }
        });
    } catch (error) {
        console.error('Error adding link to user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
//to write the function to get all links of user
const getAllLinksOfUser = async (req, res) => { }


//V
const getClicksOfLink = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
    }

    try {
        const link = await Link.findById(id);
        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        return res.status(200).json({
            id: link._id,
            clicks: link.clicks || 0 // Assuming clicks is a field in the Link model
        });
    } catch (error) {
        console.error('Error fetching clicks for link:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



//basicaly fixed, just to fix the init of the number clicks
const createShortLinkWithSource = async (req, res) => {
    const { originalUrl, source } = req.body;

    if (!originalUrl || !source) {
        return res.status(400).json({ error: 'Original URL, source, and user are required' });
    }
    try {

        // Generate a unique short URL
        const link = await generateUniqueShortUrl();
        if (!link) {

            console.error('Failed to create short link');
            return res.status(500).json({ error: 'Failed to create short link' });
        }
        //do i have to create a new link with the source and clicks?
        //if not, how to return it?  
        const newLink = new Link({
            originalUrl: originalUrl,
            shortUrl: link, // Assuming createShortLink returns an object with a shortUrl property
            user: req.user._id, // Assuming user is passed in the request body
            numOfClicks: 0, // Initialize clicks to 0
            source: source, // Assuming source is passed in the request body

            createdAt: new Date(),
        });

        const savedLink = await newLink.save();
        return res.status(201).json({
            message: 'Short link created successfully',
            link: {
                id: savedLink._id,
                originalUrl: savedLink.originalUrl,
                shortUrl: `${req.protocol}://${req.get('host')}/${savedLink.shortUrl}`,
                user: savedLink.user,
                numOfClicks: savedLink.numOfClicks,
                source: savedLink.source,
                createdAt: savedLink.createdAt,
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Failed to generate a unique short URL after multiple attempts. Please try again.' });
        }
        console.error('Error creating short link with source:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

//isnt it in the createshortLinkWithSource function?
const addLinkOfSource = async (req, res) => {
    const { id } = req.params;
    const { originalUrl } = req.body;
    if (!id || !originalUrl) {
        return res.status(400).json({ error: 'Link ID and original URL are required' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        //call to create short url
        //is it the way to send a long link to the func createShortLink?
        const shortLink = await createShortLink(originalUrl);
        const infoLink = [originalUrl, shortLink, req.body.source || 'default'];
        const shortLinkForSource = await createShortLinkWithSource(infoLink);
        user.arrOfSourceAndClicks.push({
            //where did u get the _id from?
            linkId: longLink._id,
            originalLink: originalUrl,
            shortUrl: shortLink,
            sourceId: shortLinkForSource._id,
            source: req.body.source || 'default', // Assuming source is passed in the request body
            clicks: 0 // Initialize clicks to 0
        })

        await user.save();

        return res.status(200).json({
            message: 'Link added to user successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                links: user.links
            }
        });
    } catch (error) {
        console.error('Error adding link to user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

const getClicksOLinkBySource = async (req, res) => {
    const { id, source } = req.params;
    if (!id || !source) {
        return res.status(400).json({ error: 'Link ID and source are required' });
    }

    try {
        const link = await Link.findById(id);
        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // Assuming clicksBySource is a field in the Link model that stores clicks by source
        const clicksBySource = link.clicksBySource[source] || 0;

        return res.status(200).json({
            id: link._id,
            source,
            clicks: clicksBySource
        });
    } catch (error) {
        console.error('Error fetching clicks by source for link:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports = {
    createShortLink,
    redirectToPriginalUrl: redirectToOriginalUrl,
    getDetailsLinkById,
    updateLink,
    deleteLink,
    getAllLinks,
    addLinkToUser,
    getAllLinksOfUser,
    getClicksOfLink,
    createShortLinkWithSource,
    addLinkOfSource,
    getClicksOLinkBySource
};