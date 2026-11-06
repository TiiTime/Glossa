// Real MV3 extension: actual content script, service worker, messaging and storage.
// Only Google's HTTP responses are controlled, to exercise failures deterministically.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { delay, until, connect } = require('./helpers/cdp.cjs');

test('loaded MV3 extension works across content script, worker and settings', { timeout: 30000 }, async t => {
  const executable = 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';
  assert.ok(fs.existsSync(executable), 'This integration test requires Brave with unpacked-extension support');
  const root = path.resolve(__dirname, '..');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'glossa-extension-'));
  const server = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><style>body{margin:40px;font:24px monospace}p{margin:30px 0}</style><p id="word">hello world</p><p id="fallback">fallback</p><p id="offline">offline</p><p id="later">later</p><div contenteditable="true" id="editor">private words</div><div id="host"></div><script>document.querySelector("#host").attachShadow({mode:"open"}).innerHTML="<span id=shadow>nested words</span>"</script>');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, `--disable-extensions-except=${root}`, `--load-extension=${root}`, 'about:blank'],
  { windowsHide: true, stdio: 'ignore' });
  const connections = [];
  t.after(async () => {
    for (const connection of connections) connection.close();
    const exited = once(browser, 'exit'); browser.kill(); await exited;
    server.close();
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  const activePort = path.join(profile, 'DevToolsActivePort');
  await until(() => fs.existsSync(activePort), 'browser debugging port');
  const port = Number(fs.readFileSync(activePort, 'utf8').split('\n')[0]);
  const targets = () => fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  const workerTarget = await until(async () => (await targets()).find(target =>
    target.type === 'service_worker' && target.url.endsWith('/background.js')), 'Glossa service worker loaded');
  const worker = await connect(workerTarget.webSocketDebuggerUrl); connections.push(worker);
  await worker.send('Runtime.enable');
  await until(() => worker.evaluate(`typeof chrome !== 'undefined' && !!chrome.storage?.sync`), 'extension worker initialized');
  await worker.evaluate(`chrome.storage.sync.set({targetLang:'de',sourceLang:'auto',hoverDelayMs:80,enabled:true})`);
  const network = [];
  let held = null;
  const fulfill = (requestId, text, tl, status = 200) => worker.send('Fetch.fulfillRequest', {
    requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
    body: Buffer.from(JSON.stringify({ src: 'en', sentences: [{ trans: `${tl}:${text}` }] })).toString('base64'),
  });
  const interceptionErrors = [];
  worker.on('Fetch.requestPaused', event => {
    const url = new URL(event.request.url);
    const text = url.searchParams.get('q');
    const tl = url.searchParams.get('tl');
    network.push({ text, tl, host: url.hostname });
    if (text === 'later') { held = { requestId: event.requestId, text, tl }; return; }
    const status = text === 'offline' || (text === 'fallback' && url.hostname === 'translate.googleapis.com') ? 503 : 200;
    fulfill(event.requestId, text, tl, status).catch(error => interceptionErrors.push(error.message));
  });
  await worker.send('Fetch.enable', { patterns: [
    { urlPattern: 'https://translate.googleapis.com/*' }, { urlPattern: 'https://clients5.google.com/*' },
  ] });
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:${server.address().port}/`, { method: 'PUT' })).json();
  const page = await connect(target.webSocketDebuggerUrl); connections.push(page);
  const contexts = [];
  const errors = [];
  page.on('Runtime.executionContextCreated', ({ context }) => contexts.push(context));
  page.on('Runtime.exceptionThrown', ({ exceptionDetails }) => errors.push(exceptionDetails.text));
  await page.send('Runtime.enable');
  const isolated = await until(async () => {
    for (const context of contexts.filter(c => !c.auxData?.isDefault)) {
      if (await page.evaluate(`typeof onMouseMove === 'function' && typeof settingsReady !== 'undefined' && settingsReady`, context.id)) return context;
    }
  }, 'real content script loaded with saved settings');
  const popup = () => page.evaluate(`popupEl?.textContent || ''`, isolated.id);
  async function move(selector) {
    const point = await page.evaluate(`(() => {
      const el=${selector.startsWith('shadow:') ? `document.querySelector('#host').shadowRoot.querySelector(${JSON.stringify(selector.slice(7))})` : `document.querySelector(${JSON.stringify(selector)})`};
      const rect=el.getBoundingClientRect();return {x:rect.left+3,y:rect.top+rect.height/2};
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
  }
  await t.test('hover uses actual worker translation and cached repeat lookups', async () => {
    await move('#word');
    await until(async () => (await popup()).includes('de:hello'), 'hover translation');
    assert.equal(network.filter(r => r.text === 'hello').length, 1);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
    await move('#word');
    await until(async () => (await popup()).includes('de:hello'), 'cached translation');
    assert.equal(network.filter(r => r.text === 'hello').length, 1);
  });
  await t.test('fallback endpoint succeeds after the primary endpoint fails', async () => {
    await move('#fallback');
    await until(async () => (await popup()).includes('de:fallback'), 'fallback translation');
    assert.deepEqual(network.filter(r => r.text === 'fallback').map(r => r.host), ['translate.googleapis.com', 'clients5.google.com']);
  });
  await t.test('both endpoints failing displays an error instead of hanging', async () => {
    await move('#offline');
    await until(async () => (await popup()).includes('Fehlgeschlagen'), 'network error');
    assert.equal(network.filter(r => r.text === 'offline').length, 2);
  });
  await t.test('nested-page text and editor protection work in the actual extension', async () => {
    await move('shadow:#shadow');
    await until(async () => (await popup()).includes('de:nested'), 'shadow translation');
    const before = network.length;
    await move('#editor'); await delay(160);
    assert.equal(await popup(), '');
    assert.equal(network.length, before);
  });
  await t.test('real storage language changes invalidate visible translations', async () => {
    await worker.evaluate(`chrome.storage.sync.set({targetLang:'fr'})`);
    await until(() => page.evaluate(`settings.targetLang === 'fr'`, isolated.id), 'language propagated');
    await move('#word');
    await until(async () => (await popup()).includes('fr:hello'), 'new target language');
  });
  await t.test('selecting text translates the full selection via actual extension messaging', async () => {
    await page.evaluate(`(() => {
      const el=document.querySelector('#word');const range=document.createRange();range.selectNodeContents(el);
      getSelection().removeAllRanges();getSelection().addRange(range);
      el.dispatchEvent(new MouseEvent('mouseup',{button:0,bubbles:true}));
    })()`);
    await until(async () => (await popup()).includes('fr:hello world'), 'selected text translation');
    await page.evaluate('getSelection().removeAllRanges()');
  });
  await t.test('the real settings popup loads and saves zero delay through chrome.storage', async () => {
    const popupUrl = new URL('popup.html', workerTarget.url).href;
    const popupTarget = await (await fetch(`http://127.0.0.1:${port}/json/new?${popupUrl}`, { method: 'PUT' })).json();
    const settingsPage = await connect(popupTarget.webSocketDebuggerUrl); connections.push(settingsPage);
    await until(() => settingsPage.evaluate(`document.getElementById('targetLang')?.value === 'fr'`), 'popup settings loaded');
    await settingsPage.evaluate(`document.getElementById('hoverDelayMs').value='0';document.getElementById('save').click()`);
    await until(() => settingsPage.evaluate(`document.getElementById('status').textContent === 'Gespeichert'`), 'popup save feedback');
    assert.equal(await worker.evaluate(`chrome.storage.sync.get('hoverDelayMs').then(s=>s.hoverDelayMs)`), 0);
    await fetch(`http://127.0.0.1:${port}/json/close/${popupTarget.id}`);
  });
  await t.test('disabling during a real network request discards its late result', async () => {
    await move('#later'); await until(() => held, 'held network request');
    await worker.evaluate(`chrome.storage.sync.set({enabled:false})`);
    await until(() => page.evaluate(`!settings.enabled`, isolated.id), 'disabled propagated');
    await fulfill(held.requestId, held.text, held.tl);
    await delay(150);
    assert.equal(await popup(), '');
  });
  assert.deepEqual(interceptionErrors, []);
  assert.deepEqual(errors, []);
});
