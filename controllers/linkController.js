import mongoose from 'mongoose';
import Link from '../models/Link.js';
import User from '../models/User.js';
import generateUniqueShortCode from '../utils/urlGenerator.js';
import { isValidHttpUrl, isValidShortCode, normalizeSource } from '../utils/validation.js';

const buildShortUrl = (req, shortCode, source) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
  return source ? `${baseUrl}?src=${encodeURIComponent(source)}` : baseUrl;
};

const serializeLink = (req, link) => ({
  id: link._id,
  originalUrl: link.originalUrl,
  shortUrl: buildShortUrl(req, link.shortUrl),
  user: link.user,
  clicks: link.clicks,
  sources: link.sources,
  createdAt: link.createdAt,
});

const resolveShortCode = async (customShortCode) => {
  if (!customShortCode) {
    return generateUniqueShortCode();
  }
  if (!isValidShortCode(customShortCode)) {
    return null;
  }
  return customShortCode;
};

const createLink = async (req, res, userId = undefined) => {
  const { originalUrl, customShortCode, customerShortCode, source } = req.body;
  const requestedCode = customShortCode ?? customerShortCode;

  if (!isValidHttpUrl(originalUrl)) {
    return res.status(400).json({ error: 'A valid HTTP or HTTPS originalUrl is required' });
  }

  const trackingSource = normalizeSource(source, null);
  if (source !== undefined && trackingSource === null) {
    return res.status(400).json({ error: 'source must be 1-50 letters, numbers, hyphens, or underscores' });
  }

  try {
    const shortCode = await resolveShortCode(requestedCode);
    if (!shortCode) {
      return res.status(400).json({ error: 'customShortCode must be 4-15 letters, numbers, hyphens, or underscores' });
    }

    if (requestedCode && (await Link.exists({ shortUrl: shortCode }))) {
      return res.status(409).json({ error: 'The requested custom short code is already in use' });
    }

    const link = await Link.create({
      originalUrl,
      shortUrl: shortCode,
      user: userId,
      sources: trackingSource ? [{ name: trackingSource, clicks: 0 }] : [],
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { $addToSet: { links: link._id } });
    }

    return res.status(201).json({
      message: 'Link created successfully',
      link: serializeLink(req, link),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'The short code is already in use; please retry' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createShortLink = (req, res) => createLink(req, res);

export const createAuthenticatedShortLink = (req, res) => createLink(req, res, req.user.id);

export const redirectToOriginalUrl = async (req, res) => {
  const trackingSource = normalizeSource(req.query.src);
  if (trackingSource === null) {
    return res.status(400).json({ error: 'src must be 1-50 letters, numbers, hyphens, or underscores' });
  }

  try {
    const link = await Link.findOne({ shortUrl: req.params.shortCode });
    if (!link) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    link.clicks += 1;
    const sourceEntry = link.sources.find(({ name }) => name === trackingSource);
    if (sourceEntry) {
      sourceEntry.clicks += 1;
    } else {
      link.sources.push({ name: trackingSource, clicks: 1 });
    }
    await link.save();

    return res.redirect(302, link.originalUrl);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDetailsLinkById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid link ID' });
  }
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
    return link
      ? res.status(200).json(serializeLink(req, link))
      : res.status(404).json({ error: 'Link not found' });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteLink = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid link ID' });
  }
  try {
    const link = await Link.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    await User.findByIdAndUpdate(req.user.id, { $pull: { links: link._id } });
    return res.status(200).json({ message: 'Link deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllLinks = async (req, res) => {
  try {
    const links = await Link.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ links: links.map((link) => serializeLink(req, link)) });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClicksOfLink = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid link ID' });
  }
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    return res.status(200).json({
      id: link._id,
      totalClicks: link.clicks,
      clicksBySource: Object.fromEntries(link.sources.map(({ name, clicks }) => [name, clicks])),
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClicksOfLinkBySource = async (req, res) => {
  const source = normalizeSource(req.query.source, null);
  if (!mongoose.isValidObjectId(req.params.id) || !source) {
    return res.status(400).json({ error: 'A valid link ID and source query parameter are required' });
  }
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    const entry = link.sources.find(({ name }) => name === source);
    return res.status(200).json({ id: link._id, source, clicks: entry?.clicks ?? 0 });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
