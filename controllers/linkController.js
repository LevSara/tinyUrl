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
            shortCode = customerShortCode;
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
    let source = req.query.src; // Use 'let' because we might reassign it for default

    console.log('in redirectToOriginalUrl in the begiging ');
    if (!shortCode) {
        return res.status(400).json({ error: 'Short code is required' });
    }
    try {
        console.log('in redirectToOriginalUrl un rty');
        // Find the link by short URL
        const link = await Link.findOne({ shortUrl: shortCode });

        if (!link) {
            return res.status(404).json({ error: 'Short URL not found' });
        }

        // Initialize sources array if it somehow doesn't exist (defensive, Mongoose default should handle this for new links)
        if (!link.sources) {
            link.sources = [];
        }

        // Increment the total click count for the link
        link.clicks += 1;

        // --- CORRECTED LOGIC FOR SOURCE TRACKING ---
        // Determine the source name to use for tracking. If `req.query.src` is not provided, default to 'web'.
        const trackingSource = source || 'web'; 

        // Find or add the source entry in the sources array
        const sourceEntry = link.sources.find(s => s.name === trackingSource);

        if (sourceEntry) {
            // If source exists, increment its clicks
            sourceEntry.clicks += 1;
        } else {
            // If source does not exist, add it to the array with 1 click
            link.sources.push({ name: trackingSource, clicks: 1 });
        }
        // --- END CORRECTED LOGIC ---

        console.log('in redirectToOriginalUrl befor save link'); // Changed 'new link' to 'link' for clarity
         console.log(link);
        await link.save(); // Save the updated link with incremented clicks and updated sources
            console.log('in redirectToOriginalUrl after save link'); // Changed 'new link' to 'link' for clarity
         console.log(link);
        console.log('in redirectToOriginalUrl befor return');


        // Redirect to the original URL
        return res.redirect(link.originalUrl);
    } catch (error) {
        console.log('in redirectToOriginalUrl in catch');
        console.error('Error redirecting to original URL:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
//i fixed this func getDetailsLinkById with gemini
export const getDetailsLinkById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    console.log('in getdetialflink befor if !id');

    if (!id) {
        return res.status(400).json({ error: 'Link ID is required' });
    }
    try {
        const link = await Link.findOne({ _id: id, user: userId });

        if (!link) {
            return res.status(404).json({ error: 'Link not found or you do not have access to it' });
        }
        // You can remove this line as we'll build it directly in the response:
        // const fullShortUrl = `${req.protocol}://${req.get('host')}/${link.shortUrl}`; 
        console.log('in getdetialflink befor return');

        return res.status(200).json({
            id: link._id,
            originalUrl: link.originalUrl,
            // --- CORRECTED LINE FOR shortUrl ---
            // Use 'link.shortUrl' and add the default source parameter
            shortUrl: `${req.protocol}://${req.get('host')}/${link.shortUrl}?src=web`, // <--- CHANGE HERE
            // --- END CORRECTED LINE ---
            user: link.user,
            clicks: link.clicks,
            sources: link.sources,
            createdAt: link.createdAt,
        });
    } catch (error) {
        console.log('in getdetialflink in catch');
        console.error('Error fetching link:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Link ID Format. ' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// //i fixed this func updateLink with gemini- not very usefull, i deleted it
// export const updateLink = async (req, res) => {
//     const { id } = req.params;
//     const { originalUrl } = req.body;
//     const userId = req.user.id;

//     if (!id || !originalUrl) {
//         return res.status(400).json({ error: 'Link ID and original URL are required' });
//     }

//     // Basic URL validation
//     try {
//         new URL(originalUrl);
//     } catch (e) {
//         return res.status(400).json({ error: 'Invalid original URL format.' });
//     }

//     try {
//         const updatedLink = await Link.findOneAndUpdate(
//             { _id: id, user: userId },
//             { originalUrl: originalUrl },
//             { new: true, runValidators: true }
//         );

//         if (!updatedLink) {
//             return res.status(404).json({ error: 'Link not found or you do not have access to it.' });
//         }
//         const fullShortUrl = `${req.protocol}://${req.get('host')}/${updatedLink.shortUrl}`; // Use updatedLink.shortUrl

//         return res.status(200).json({
//             message: 'Link updated successfully',
//             link: {
//                 id: updatedLink._id,
//                 originalUrl: updatedLink.originalUrl,
//                 shortUrl: fullShortUrl
//             }
//         });
//     } catch (error) {
//         console.error('Error updating link:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: 'Invalid Link ID format.' });
//         }
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// }

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
        console.log('in getalllink in try');
        // Find all links that belong to the authenticated user
        const links = await Link.find({ user: userId }); // Assuming 'user' field in Link model stores userId
        console.log('in getalllink before return');


        const formattedLinks = links.map(link => ({
            id: link._id,
            originalUrl: link.originalUrl,
            shortUrl: `${req.protocol}://${req.get('host')}/${link.shortUrl}?src=web`,
            user: link.user,
            clicks: link.clicks,
            sources: link.sources,
            createdAt: link.createdAt,
        }));

        return res.status(200).json({ links: formattedLinks });



    } catch (error) {
        console.log('in getalllink in catch ');
        console.error('Error fetching all links for user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


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
            totalClicks: link.clicks || 0, // Use numOfClicks for total
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

export const createAuthenticatedShortLink = async (req, res) => {
    console.log('Incoming request body:', req.body);
    const { originalUrl, source, customerShortCode } = req.body;
    const userId = req.user.id; // Get ID from authenticated user

    if (!originalUrl) {
        return res.status(400).json({ error: 'Original URL is required.' });
    }

    try {
        console.log('in createAuthentictedShortLink try 1');

        // Determine shortUrl
        const shortUrl = customerShortCode || await generateUniqueShortUrl();

        // Initialize sources array
        let initialSources = [];
        console.log('Value of source before if condition:', source);
        console.log('Is source truthy?', !!source);

        if (source) {
            initialSources.push({ name: source, clicks: 0 });
            console.log('initialSources after push:', initialSources);
        } else {
            console.log('Source was falsy, initialSources remains empty.');
        }

        // --- CHANGE STARTS HERE ---
        const newLink = new Link({
            originalUrl,
            shortUrl,
            user: userId,
            // Do NOT pass sources here directly for this test
        });

        // Assign initialSources *after* instantiation
        newLink.sources = initialSources;

        console.log('newLink.sources immediately after assignment:', newLink.sources); // <-- NEW LOG
        // --- CHANGE ENDS HERE ---

        console.log('newLink.sources before save:', newLink.sources); // Your existing log
        await newLink.save();
        console.log('newLink.sources AFTER save:', newLink.sources); // Your existing log


        console.log('in createAuthentictedShortLink befor return');

        res.status(201).json({
            message: 'Authenticated short link created successfully', // Or public
            link: {
                id: newLink._id,
                originalUrl: newLink.originalUrl,
                shortUrl: `${req.protocol}://${req.get('host')}/${newLink.shortUrl}?src=${source || 'web'}`,
                numOfClicks: newLink.clicks,
                sources: newLink.sources,
                createdAt: newLink.createdAt,
            }
        });
    } catch (error) {
        console.log('in createAuthentictedShortLink in catch ');
        console.error('Error creating authenticated short link:', error);
        res.status(500).json({ error: 'Failed to create authenticated short link.' });
    }
};
// export const createAuthentictedShortLink = async (req, res) => {
//       console.log('Incoming request body:', req.body);
//     const { originalUrl, source, customerShortCode } = req.body; // Added customerShortCode
//     const userId = req.user.id; // User ID from authenticated request

//     if (!originalUrl) { // Source can be optional, user is from token
//         return res.status(400).json({ error: 'Original URL is required' });
//     }
//     console.log('in createAuthentictedShortLink try 1 ')
//     // Basic URL validation
//     try {
//         new URL(originalUrl);
//     } catch (e) {
//         return res.status(400).json({ error: 'Invalid original URL format.' });
//     }
//     console.log('in createAuthentictedShortLink befor try 2')
//     try {
//         let shortCode;
//         if (customerShortCode) {
//             const existingLink = await Link.findOne({ shortUrl: customerShortCode });
//             if (existingLink) {
//                 return res.status(409).json({ error: `Custom short code '${customerShortCode}' is already in use.` });
//             }
//             if (customerShortCode.length < 4 || customerShortCode.length > 10 || !/^[a-zA-Z0-9_-]+$/.test(customerShortCode)) {
//                 return res.status(400).json({ error: 'Custom short code must be 4-10 alphanumeric characters, hyphens, or underscores.' });
//             }
//             shortCode = customerShortCode;
//         } else {
//             shortCode = await generateUniqueShortUrl(); // Get the generated short code
//         }
//         console.log('in createAuthentictedShortLink befor create newlink ')

//         // Initialize sources array
//         let initialSources = [];

//    console.log('Value of source before if condition:', source);
//         console.log('Is source truthy?', !!source); // !! converts to boolean

//         if (source) {
//             initialSources.push({ name: source, clicks: 0 }); // Initialize clicks for this source
//                         console.log('initialSources after push:', initialSources);

//         }
//         // Create a new link associated with the authenticated user
//         const newLink = new Link({
//             originalUrl: originalUrl,
//             shortUrl: shortCode,
//             user: userId, // Associate the link with the authenticated user
//             numOfClicks: 0, // Initialize total clicks to 0
//             clicksBySource: source ? new Map([[source, 0]]) : new Map(), // Initialize clicksBySource
//             createdAt: new Date(),
//         });
//                 console.log('newLink.sources before save:', newLink.sources);


//         // Save the link
//         const savedLink = await newLink.save();
//                 console.log('newLink.sources AFTER save:', newLink.sources);

//         console.log('in createAuthentictedShortLink befor update link to user')

//         // Optional: If User schema has a 'links' array, add the new link's ID
//         // This makes it easy to populate links when fetching a user.
//         await User.findByIdAndUpdate(
//             userId,
//             { $push: { links: savedLink._id } },
//             { new: true }
//         );

//         // Construct the full short URL
//         const fullShortUrl = `${req.protocol}://${req.get('host')}/${savedLink.shortUrl}`;
//         console.log('in createAuthentictedShortLink befor return ')

//         return res.status(201).json({
//             message: 'Short link created successfully',
//             link: {
//                 id: savedLink._id,
//                 originalUrl: savedLink.originalUrl,
//                 shortUrl: fullShortUrl,
//                 user: savedLink.user, // The user ID it's associated with
//                 numOfClicks: savedLink.clicks,
//                 sources: savedLink.sources,
//                 createdAt: savedLink.createdAt,
//             }
//         });
//     } catch (error) {
//         console.log('in createAuthentictedShortLink in catch')

//         if (error.code === 11000) {
//             return res.status(409).json({ error: 'Failed to generate a unique short URL after multiple attempts. Please try again.' });
//         }
//         console.error('Error creating short link with source:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

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

