const generateUniqueShortUrl = async () => {
    let shortUrl = '';
    let isUnique = false;
    const SHORT_URL_LENGTH = 6;
    while (!isUnique) {
        shortUrl = nanoid(SHORT_URL_LENGTH);//generate a short URL
        const existingLink = await Link.findone({ shortUrl });//to check if the short URL is unique
        if (!existingLink) {
            isUnique = true; // If no existing link found, the short URL is unique
        }
    }
    return shortUrl; // Return the unique short URL
}

exports.generateUniqueShortUrl = generatUniqeShorteUrl;// Export the function for use in other parts of the application
