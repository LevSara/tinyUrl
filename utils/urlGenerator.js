import {nanoid} from 'nanoid';

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

export default generateUniqueShortUrl;