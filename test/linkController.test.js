import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createShortLink, redirectToOriginalUrl } from '../controllers/linkController.js';
import Link from '../models/Link.js';

const originals = { create: Link.create, exists: Link.exists, findOne: Link.findOne };
afterEach(() => Object.assign(Link, originals));

const response = () => ({
  statusCode: 200,
  body: undefined,
  redirectValue: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  redirect(code, url) { this.statusCode = code; this.redirectValue = url; return this; },
});

const request = (overrides = {}) => ({
  body: {}, params: {}, query: {}, protocol: 'http', get: () => 'localhost:3000', ...overrides,
});

test('rejects an invalid URL before accessing the database', async () => {
  Link.create = async () => assert.fail('database should not be called');
  const res = response();
  await createShortLink(request({ body: { originalUrl: 'file:///etc/passwd' } }), res);
  assert.equal(res.statusCode, 400);
});

test('returns conflict when a custom short code already exists', async () => {
  Link.exists = async () => true;
  const res = response();
  await createShortLink(request({ body: { originalUrl: 'https://example.com', customShortCode: 'docs-1' } }), res);
  assert.equal(res.statusCode, 409);
});

test('creates a public short link with a custom code', async () => {
  Link.exists = async () => false;
  Link.create = async (data) => ({ _id: 'link-id', clicks: 0, sources: [], createdAt: new Date(0), ...data });
  const res = response();
  await createShortLink(request({ body: { originalUrl: 'https://example.com/docs', customShortCode: 'docs-1' } }), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.link.shortUrl, 'http://localhost:3000/docs-1');
});

test('creates a generated short code when no custom code is supplied', async () => {
  Link.exists = async () => false;
  Link.create = async (data) => ({ _id: 'link-id', clicks: 0, sources: [], createdAt: new Date(0), ...data });
  const res = response();
  await createShortLink(request({ body: { originalUrl: 'https://example.com' } }), res);
  assert.equal(res.statusCode, 201);
  assert.match(res.body.link.shortUrl, /^http:\/\/localhost:3000\/[A-Za-z0-9_-]{7}$/);
});

test('redirects and records total and source clicks', async () => {
  let saved = false;
  const link = { originalUrl: 'https://example.com', clicks: 2, sources: [], save: async () => { saved = true; } };
  Link.findOne = async () => link;
  const res = response();
  await redirectToOriginalUrl(request({ params: { shortCode: 'abc123' }, query: { src: 'email' } }), res);
  assert.equal(res.statusCode, 302);
  assert.equal(res.redirectValue, 'https://example.com');
  assert.equal(link.clicks, 3);
  assert.deepEqual(link.sources, [{ name: 'email', clicks: 1 }]);
  assert.equal(saved, true);
});

test('returns not found for an unknown short code', async () => {
  Link.findOne = async () => null;
  const res = response();
  await redirectToOriginalUrl(request({ params: { shortCode: 'missing' } }), res);
  assert.equal(res.statusCode, 404);
});

test('returns a safe server error when link creation fails', async () => {
  Link.exists = async () => false;
  Link.create = async () => { throw new Error('database unavailable'); };
  const res = response();
  await createShortLink(request({ body: { originalUrl: 'https://example.com', customShortCode: 'valid-code' } }), res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Internal server error' });
});
