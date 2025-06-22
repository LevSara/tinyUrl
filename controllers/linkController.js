// import nanoid from 'nanoid';
import User from '../models/User.js';
import Link from '../models/Link.js';
import generateUniqueShortUrl from '../utils/urlGenerator.js';


//i fixed this func createShortLink with gemini
export const createShortLink = async (req, res) => {
    const { originalUrl, customerShortCode } = req.body;

    if (!originalUrl) {
        console.log('in the func createshortlink in if !originalurl');
        return res.status(400).json({ error: 'Original URL is required' });
    }
    // Basic URL validation (optional but highly recommended)
    try {
        new URL(originalUrl)
    } catch (e) {
        return res.status(400).json({ erro: 'Invalid original URL format.' })
    }

    try {
        console.log('in the func createshortlink in try ');
        let shortCode;
        // const shortCode = await generateUniqueShortUrl(); // call to the function generates a unique short URL
        console.log('in try after let shortcode')
        if (customerShortCode) {
            const existingLink = await Link.findOne({ shortUrl: customerShortCode })
            if (existingLink) {
                return res.status(409).json({ error: `Customer short code '${customerShortCode}'is already in use.` })
            }
            if (customerShortCode.length < 4 || customerShortCode.length > 15 || !/^[a-zA-Z0-9_-]+$/.test(customerShortCode)) {
                return res.status(400).json({ error: 'custom short code must be 4-10 alphanumeric characters, hyphens, or underscores.' })
            }
            shortCode = customerShortCode; // Assigned here if customerShortCode exists
        }
        else {
            shortCode = await generateUniqueShortUrl();
            console.log('in the func createshortlink in try after creating shortcode');

        }

        //create an instance of the Link model in mongoose
        const newLink = new Link({
            originalUrl: originalUrl,
            shortUrl: shortCode,
            numOfClicks: 0,
            clickBySource: new Map(),
        })
        console.log('in the func createshortlink afyer creating new link');

        //to save the new link to the database
        const savedLink = await newLink.save();
        // Construct the full short URL
        const fullShortUrl = `${req.protocol}://${req.get('host')}/${savedLink.shortUrl}`;
        // Return the response with the saved link details
        console.log('in the func createshortlink befor return 201');

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
            console.log('in the func createshortlink in catch error code 11000');

            return res.status(409).json({ error: 'Failed to generate a unique short URL after multiple attempts. Please try again.' });
        }
        // console.error('Error creating link:', error);
        console.log('in the func createshortlink after catch  befor 500');

        return res.status(500).json({ error: 'Internal server error' });
    }
};
//i fixed this func redirectToOriginalUrl with gemini
export const redirectToOriginalUrl = async (req, res) => {
    const { shortCode } = req.params;
    console.log('in redirectToOriginalUrl in the begiging ')
    if (!shortCode) {
        return res.status(400).json({ error: 'Short code is required' });
    }
    try {
        console.log('in redirectToOriginalUrl un rty')
        // Find the link by short URL
        const link = await Link.findOne({ shortUrl: shortCode });

        if (!link) {
            return res.status(404).json({ error: 'short URL not found' });
        }

        //tracking the clicks
        // Increment the click count
        link.numOfClicks += 1;

        const incomingSource = req.query.s || link.source || 'direct'; // Get the source from query params or use the link's source
        const currentClicksOfSource = link.clicksBySource.get(incomingSource) || 0; // Get current clicks for the source or default to 0
        link.clicksBySource.set(incomingSource, currentClicksOfSource + 1); // Increment clicks for the source 
        console.log('in redirectToOriginalUrl befor save new link')
        await link.save();//save the updated link with incremented clicks
        console.log('in redirectToOriginalUrl befor return')
        // Redirect to the original URL
        return res.redirect(link.originalUrl);
    } catch (error) {
        console.error('Error redirecting to original URL:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

//i fixed this func getDetailsLinkById with gemini
export const getDetailsLinkById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    console.log('in getdetialflink befor if !id')

    if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
    }
    try {
        const link = await Link.findOne({ _id: id, user: userId });

        if (!link) {
            return res.status(404).json({ error: 'Link not found or you do not have access to it' });
        }
        const fullShortUrl = `${req.protocol}://${req.get('host')}/${link.shortUrl}`;
        console.log('in getdetialflink befor return')

        return res.status(200).json({
            id: link._id,
            originalUrl: link.originalUrl,
            shortUrl: fullShortUrl,
            source: link.source || 'default', // Assuming source is a field in the Link model
            numOfClicks: link.clicks || 0, // Assuming clicks is a field in the Link model
            clicksBySource: link.clicksBySource ? Object.fromEntries(link.clicksBySource) : {},
        });
    } catch (error) {
        console.log('in getdetialflink in catch')
        console.error('Error fetching link:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Link ID Format. ' })
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

//i fixed this func updateLink with gemini
export const updateLink = async (req, res) => {
    const { id } = req.params;
    const { originalUrl } = req.body;
    const userId = req.user.id;

    if (!id || !originalUrl) {
        return res.status(400).json({ error: 'Link ID and original URL are required' });
    }

    // Basic URL validation
    try {
        new URL(originalUrl);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid original URL format.' });
    }

    try {
        const updatedLink = await Link.findOneAndUpdate(
            { _id: id, user: userId },
            { originalUrl: originalUrl },
            { new: true, runValidators: true }
        );

        if (!updatedLink) {
            return res.status(404).json({ error: 'Link not found or you do not have access to it.' });
        }
        const fullShortUrl = `${req.protocol}://${req.get('host')}/${updatedLink.shortUrl}`; // Use updatedLink.shortUrl

        return res.status(200).json({
            message: 'Link updated successfully',
            link: {
                id: updatedLink._id,
                originalUrl: updatedLink.originalUrl,
                shortUrl: fullShortUrl
            }
        });
    } catch (error) {
        console.error('Error updating link:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Link ID format.' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}

//i fixed this func deleteLink with gemini
export const deleteLink = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
console.log('in deletelink befor !id')
    if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
    }

    try {
        console.log('in deletelink in rty')

        const deletedLink = await Link.findOneAndDelete({ _id: id, user: userId });

        if (!deletedLink) {
            return res.status(404).json({ error: 'Link not found or you do not have access to it.' });
        }

        return res.status(200).json({ message: 'Link deleted successfully' });
    } catch (error) {
        console.log('in deletelink in catch ')

        console.error('Error deleting link:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Link ID format.' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

//i fixed this func getAllLinks with gemini
export const getAllLinks = async (req, res) => {
    const userId = req.user.id; // Get user ID from authMiddleware

    try {
        console.log('in getalllink in try')
        // Find all links that belong to the authenticated user
        const links = await Link.find({ user: userId }); // Assuming 'user' field in Link model stores userId
        console.log('in getalllink befor construction ')

        // Construct full short URLs for each link
        const formattedLinks = links.map(link => ({
            id: link._id,
            originalUrl: link.originalUrl,
            shortUrl: `${req.protocol}://${req.get('host')}/${link.shortUrl}`,
            numOfClicks: link.numOfClicks,
            clicksBySource: Object.fromEntries(link.clicksBySource), // Convert Map to object
            createdAt: link.createdAt,

        }));
        console.log('in getalllink before return')

        return res.status(200).json(formattedLinks);
    } catch (error) {
        console.log('in getalllink in catch ')

        console.error('Error fetching all links for user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

//no need to that func- user create a link straight to his acoount
// const addLinkToUser = async (req, res) => {
//     const { userId, linkId } = req.body;

//     if (!userId || !linkId) {
//         return res.status(400).json({ error: 'User ID and Link ID are required' });
//     }

//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         user.links.push(linkId);
//         await user.save();

//         return res.status(200).json({
//             message: 'Link added to user successfully',
//             user: {
//                 id: user._id,
//                 name: user.name,
//                 email: user.email,
//                 links: user.links
//             }
//         });
//     } catch (error) {
//         console.error('Error adding link to user:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// }
//to write the function to get all links of user
// const getAllLinksOfUser = async (req, res) => { }


//i fixed this func getClicksOfLink with gemini
export const getClicksOfLink = async (req, res) => {
    const { id } = req.params; // MongoDB _id
    const userId = req.user.id; // Get user ID from authMiddleware

    if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
    }

    try {
        // Find the link by _id AND ensure it belongs to the authenticated user
        const link = await Link.findOne({ _id: id, user: userId });

        if (!link) {
            return res.status(404).json({ error: 'Link not found or you do not have access to it.' });
        }

        return res.status(200).json({
            id: link._id,
            originalUrl: link.originalUrl, // Include original URL for context
            shortUrl: `${req.protocol}://${req.get('host')}/${link.shortUrl}`, // Full short URL
            totalClicks: link.numOfClicks || 0, // Use numOfClicks for total
            clicksBySource: Object.fromEntries(link.clicksBySource || new Map()), // Return map as object
        });
    } catch (error) {
        console.error('Error fetching clicks for link:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Link ID format.' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}

//i fixed this func createShortLinkWithSource with gemini
export const createShortLinkWithSource = async (req, res) => {
    const { originalUrl, source, customerShortCode } = req.body; // Added customerShortCode
    const userId = req.user.id; // User ID from authenticated request

    if (!originalUrl) { // Source can be optional, user is from token
        return res.status(400).json({ error: 'Original URL is required' });
    }
    console.log('in createshortlinkwithsource try 1 ')
    // Basic URL validation
    try {
        new URL(originalUrl);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid original URL format.' });
    }
    console.log('in createshortlinkwithsource befor try 2')
    try {
        let shortCode;
        if (customerShortCode) {
            const existingLink = await Link.findOne({ shortUrl: customerShortCode });
            if (existingLink) {
                return res.status(409).json({ error: `Custom short code '${customerShortCode}' is already in use.` });
            }
            if (customerShortCode.length < 4 || customerShortCode.length > 10 || !/^[a-zA-Z0-9_-]+$/.test(customerShortCode)) {
                return res.status(400).json({ error: 'Custom short code must be 4-10 alphanumeric characters, hyphens, or underscores.' });
            }
            shortCode = customerShortCode;
        } else {
            shortCode = await generateUniqueShortUrl(); // Get the generated short code
        }
        console.log('in createshortlinkwithsource befor create newlink ')

        // Create a new link associated with the authenticated user
        const newLink = new Link({
            originalUrl: originalUrl,
            shortUrl: shortCode,
            user: userId, // Associate the link with the authenticated user
            numOfClicks: 0, // Initialize total clicks to 0
            clicksBySource: source ? new Map([[source, 0]]) : new Map(), // Initialize clicksBySource
            createdAt: new Date(),
        });

        // Save the link
        const savedLink = await newLink.save();
        console.log('in createshortlinkwithsource befor update link to user')

        // Optional: If User schema has a 'links' array, add the new link's ID
        // This makes it easy to populate links when fetching a user.
        await User.findByIdAndUpdate(
            userId,
            { $push: { links: savedLink._id } },
            { new: true }
        );

        // Construct the full short URL
        const fullShortUrl = `${req.protocol}://${req.get('host')}/${savedLink.shortUrl}`;
        console.log('in createshortlinkwithsource befor return ')

        return res.status(201).json({
            message: 'Short link created successfully',
            link: {
                id: savedLink._id,
                originalUrl: savedLink.originalUrl,
                shortUrl: fullShortUrl,
                user: savedLink.user, // The user ID it's associated with
                numOfClicks: savedLink.numOfClicks,
                clicksBySource: Object.fromEntries(savedLink.clicksBySource),
                createdAt: savedLink.createdAt,
            }
        });
    } catch (error) {
        console.log('in createshortlinkwithsource in catch')

        if (error.code === 11000) {
            return res.status(409).json({ error: 'Failed to generate a unique short URL after multiple attempts. Please try again.' });
        }
        console.error('Error creating short link with source:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

//i fixed this func getClicksOLinkBySource with gemini
export const getClicksOfLinkBySource = async (req, res) => {
    const { id, source } = req.params;
    const userID = req.user.id;

    if (!id || !source) {
        return res.status(400).json({ error: 'Link ID and source are required' });
    }

    try {
        const link = await Link.findOne({ _id: id, user: userID });
        if (!link) {
            return res.status(404).json({ error: 'Link not found or you do not have access to it.' });
        }
        const clicksBySpecificSource = link.clicksBySource.get(source) || 0; // Use .get() for Map
        return res.status(200).json({
            id: link._id,
            source: source,
            clicks: clicksBySpecificSource
        });

    } catch (error) {
        console.error('Error fetching clicks by source for link:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Link ID format.' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

