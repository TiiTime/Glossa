const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const version = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'))).version;

function worker(data = {}, { failTab = false } = {}) {
  const listeners = [];
  const tabs = [];
  const warnings = [];
  const context = vm.createContext({
    console: { warn: (...args) => warnings.push(args) },
    chrome: {
      runtime: {
        onMessage: { addListener() {} },
        onInstalled: { addListener(fn) { listeners.push(fn); } },
        getManifest: () => ({ version }),
        getURL: file => `chrome-extension://glossa-test/${file}`,
      },
      storage: { local: {
        get: async key => ({ [key]: data[key] }),
        set: async values => Object.assign(data, values),
      } },
      tabs: { create: async options => {
        if (failTab) throw new Error('tab unavailable');
        tabs.push(options);
        return { id: tabs.length };
      } },
    },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8'), context);
  return { data, tabs, warnings, async event(details) {
    await Promise.all(listeners.map(fn => fn(details)));
  } };
}

test('an installed new version opens its bundled release notes', async () => {
  const w = worker();
  await w.event({ reason: 'update', previousVersion: '1.0.10' });
  assert.equal(w.tabs.length, 1);
  assert.equal(w.tabs[0].url, 'chrome-extension://glossa-test/updates.html');
  assert.equal(w.data.lastUpdateNoticeVersion, version);
});

test('initial install, browser update, and same-version reload open no update tab', async () => {
  const w = worker();
  for (const details of [{ reason: 'install' }, { reason: 'chrome_update' },
    { reason: 'update', previousVersion: version }]) await w.event(details);
  assert.equal(w.tabs.length, 0);
});

test('duplicate update events open only one tab, including simultaneous delivery', async () => {
  const w = worker();
  await Promise.all([w.event({ reason: 'update', previousVersion: '1.0.10' }),
    w.event({ reason: 'update', previousVersion: '1.0.10' })]);
  assert.equal(w.tabs.length, 1);
});

test('shown marker survives a worker restart and allows the next version', async () => {
  const data = { lastUpdateNoticeVersion: '1.0.9' };
  const first = worker(data);
  await first.event({ reason: 'update', previousVersion: '1.0.10' });
  assert.equal(first.tabs.length, 1);
  const restarted = worker(data);
  await restarted.event({ reason: 'update', previousVersion: '1.0.10' });
  assert.equal(restarted.tabs.length, 0);
});

test('failed tab creation does not suppress a later successful attempt', async () => {
  const data = {};
  const failed = worker(data, { failTab: true });
  await failed.event({ reason: 'update', previousVersion: '1.0.10' });
  assert.notEqual(data.lastUpdateNoticeVersion, version);
  assert.equal(failed.warnings.length, 1);
  const retry = worker(data);
  await retry.event({ reason: 'update', previousVersion: '1.0.10' });
  assert.equal(retry.tabs.length, 1);
});
