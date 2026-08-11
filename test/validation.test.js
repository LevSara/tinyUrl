import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidHttpUrl, isValidShortCode, normalizeSource } from '../utils/validation.js';

test('accepts HTTP(S) URLs and rejects unsafe or malformed protocols', () => {
  assert.equal(isValidHttpUrl('https://example.com/a?b=1'), true);
  assert.equal(isValidHttpUrl('http://localhost:3000'), true);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('not a URL'), false);
});

test('validates custom short codes at documented boundaries', () => {
  assert.equal(isValidShortCode('my_code-1'), true);
  assert.equal(isValidShortCode('abc'), false);
  assert.equal(isValidShortCode('contains space'), false);
});

test('normalizes tracking sources and applies a safe default', () => {
  assert.equal(normalizeSource(undefined), 'direct');
  assert.equal(normalizeSource('newsletter_1'), 'newsletter_1');
  assert.equal(normalizeSource('bad source'), null);
});
