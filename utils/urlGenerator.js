import { nanoid } from 'nanoid';
import Link from '../models/Link.js';

const SHORT_CODE_LENGTH = 7;
const MAX_GENERATION_ATTEMPTS = 5;

const generateUniqueShortCode = async () => {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const shortCode = nanoid(SHORT_CODE_LENGTH);
    const existingLink = await Link.exists({ shortUrl: shortCode });

    if (!existingLink) {
      return shortCode;
    }
  }

  throw new Error('Unable to generate a unique short code');
};

export default generateUniqueShortCode;
