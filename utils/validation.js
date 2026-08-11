const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{4,15}$/;
const SOURCE_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;

export const isValidHttpUrl = (value) => {
  if (typeof value !== 'string' || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidShortCode = (value) => SHORT_CODE_PATTERN.test(value);

export const normalizeSource = (value, fallback = 'direct') => {
  if (value === undefined || value === '') {
    return fallback;
  }

  return typeof value === 'string' && SOURCE_PATTERN.test(value) ? value : null;
};
