import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { login, registerUser } from '../controllers/authController.js';
import User from '../models/User.js';

const originals = { create: User.create, findOne: User.findOne };
afterEach(() => Object.assign(User, originals));

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test('rejects weak registration data before accessing the database', async () => {
  User.create = async () => assert.fail('database should not be called');
  const res = response();
  await registerUser({ body: { userName: 'A', email: 'invalid', password: 'short' } }, res);
  assert.equal(res.statusCode, 400);
});

test('returns conflict for a duplicate registration', async () => {
  User.create = async () => { const error = new Error('duplicate'); error.code = 11000; throw error; };
  const res = response();
  await registerUser({ body: { userName: 'developer', email: 'dev@example.com', password: 'secure-password' } }, res);
  assert.equal(res.statusCode, 409);
});

test('uses one login response for an unknown account', async () => {
  User.findOne = () => ({ select: async () => null });
  const res = response();
  await login({ body: { email: 'missing@example.com', password: 'secure-password' } }, res);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Invalid email or password' });
});
