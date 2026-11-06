const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function worker() {
  const requests = [];
  const context = vm.createContext({
    chrome: { runtime: { onMessage: { addListener() {} }, onInstalled: { addListener() {} } } },
    AbortSignal,
    fetch(url) {
      return new Promise((resolve, reject) => requests.push({ url, resolve, reject }));
    },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8'), context);
  return { context, requests, translate: (text, sl = 'auto', tl = 'de') => context.translateText(text, sl, tl) };
}
function success(request, translation = 'Hallo') {
  request.resolve({ ok: true, json: async () => ({ src: 'en', sentences: [{ trans: translation }] }) });
}
const settle = () => new Promise(setImmediate);

test('concurrent identical lookups share one network request and cache the result', async () => {
  const w = worker();
  const first = w.translate('hello');
  const second = w.translate(' hello ');
  assert.equal(w.requests.length, 1);
  success(w.requests[0]);
  assert.equal((await first).translation, 'Hallo');
  assert.equal((await second).translation, 'Hallo');
  assert.equal((await w.translate('hello')).cached, true);
  assert.equal(w.requests.length, 1);
});

test('different target languages do not share an in-flight translation', async () => {
  const w = worker();
  const de = w.translate('hello');
  const fr = w.translate('hello', 'auto', 'fr');
  assert.equal(w.requests.length, 2);
  success(w.requests[0], 'Hallo');
  success(w.requests[1], 'Bonjour');
  assert.equal((await de).translation, 'Hallo');
  assert.equal((await fr).translation, 'Bonjour');
});

test('concurrent lookups share fallback and a failed request can be retried', async () => {
  const w = worker();
  const first = w.translate('hello');
  const second = w.translate('hello');
  assert.equal(w.requests.length, 1);
  w.requests[0].reject(new Error('offline'));
  await settle();
  assert.equal(w.requests.length, 2);
  assert.match(w.requests[1].url, /clients5/);
  w.requests[1].reject(new Error('offline'));
  assert.equal((await first).ok, false);
  assert.equal((await second).ok, false);
  const retry = w.translate('hello');
  assert.equal(w.requests.length, 3);
  success(w.requests[2]);
  assert.equal((await retry).ok, true);
});

test('invalid inputs never initiate network requests', async () => {
  const w = worker();
  assert.equal((await w.translate(' ')).error, 'empty');
  assert.equal((await w.translate('a'.repeat(2001))).error, 'too_long');
  assert.equal(w.requests.length, 0);
});
