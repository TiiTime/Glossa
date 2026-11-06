const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const source = fs.readFileSync(path.join(__dirname, '../content.js'), 'utf8');
let browser, profile, port;
before(async () => {
  const executable = process.env.GLOSSA_TEST_BROWSER || [
    'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(p => fs.existsSync(p));
  assert.ok(executable, 'Set GLOSSA_TEST_BROWSER to a Chromium executable');
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'glossa-tests-'));
  browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  const activePort = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(activePort); i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  port = Number(fs.readFileSync(activePort, 'utf8').split('\n')[0]);
});
after(async () => {
  if (browser) {
    const exited = once(browser, 'exit');
    browser.kill();
    await exited;
  }
  // The temporary isolated profile can remain locked briefly by Chromium children.
  if (profile) fs.rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

async function page(t, { deferInitial = false } = {}) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = e => {
    const message = JSON.parse(e.data);
    const entry = pending.get(message.id);
    if (entry) { pending.delete(message.id); message.error ? entry.reject(message.error) : entry.resolve(message.result); }
  };
  function send(method, params) {
    return new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
    return result.result.value;
  }
  t.after(async () => {
    ws.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  });
  await evaluate(`
    document.body.innerHTML = '<style>body{margin:40px;font:24px monospace}p{margin:20px 0}</style><p id="one">hello world</p><p id="two">hello world</p><div id="host"></div><div id="editor" contenteditable="true"><span>secret words</span></div>';
    const outer = document.querySelector('#host').attachShadow({mode:'open'});
    outer.innerHTML = '<div id="inner"></div>';
    outer.querySelector('#inner').attachShadow({mode:'open'}).innerHTML = '<span id="shadow-word">nested words</span><div contenteditable="plaintext-only"><span id="shadow-editor">private text</span></div>';
    window.options = {targetLang:'de',sourceLang:'auto',hoverDelayMs:1000,enabled:true};
    window.requests = [];
    window.settingsReads = [];
    window.deferSettings = ${deferInitial};
    window.clock = 10000;
    let timerId = 0;
    const timers = new Map();
    Date.now = () => clock;
    window.setTimeout = (fn, ms=0) => { timers.set(++timerId,{fn,at:clock+ms}); return timerId; };
    window.clearTimeout = id => timers.delete(id);
    window.tick = async ms => {
      const until = clock + ms;
      for (;;) {
        const next = [...timers].filter(([,v]) => v.at <= until).sort((a,b) => a[1].at-b[1].at)[0];
        if (!next) break;
        clock = next[1].at; timers.delete(next[0]); next[1].fn(); await Promise.resolve();
      }
      clock = until; await Promise.resolve();
    };
    Object.defineProperty(window.chrome, 'runtime', {value:{id:'glossa-test',sendMessage(msg,callback){
      if(msg.type==='getSettings') { if(deferSettings) settingsReads.push(callback); else callback({...options}); }
      else if(msg.type==='translate') requests.push({msg,callback});
    }},configurable:true});
    Object.defineProperty(window.chrome, 'storage', {value:{onChanged:{addListener(fn){window.storageChanged=fn;}}},configurable:true});
    window.move = (el, offset=2) => {
      const r = document.createRange(); r.setStart(el.firstChild,0);r.setEnd(el.firstChild,5);
      const rect = r.getBoundingClientRect();
      const x=rect.left+offset,y=rect.top+rect.height/2;
      el.dispatchEvent(new MouseEvent('mousemove',{clientX:x,clientY:y,bubbles:true,composed:true}));
    };
    window.answer = (index, translation='Hallo') => requests[index].callback({ok:true,word:requests[index].msg.text,translation,dict:[]});
    window.setOptions = async changes => {
      const delta = Object.fromEntries(Object.entries(changes).map(([key,newValue])=>[key,{oldValue:options[key],newValue}]));
      Object.assign(options,changes); storageChanged(delta,'sync'); await Promise.resolve(); await Promise.resolve();
    };
    window.hasPopup = () => !!document.getElementById('glossa-host');
    window.select = (el, start=0, end=el.firstChild.length) => {
      const range = document.createRange(); range.setStart(el.firstChild,start); range.setEnd(el.firstChild,end);
      getSelection().removeAllRanges(); getSelection().addRange(range);
    };
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(options) {
      const root = attach.call(this,options);
      if(this.id === 'glossa-host') window.popupRoot = root;
      return root;
    };
    window.popupContent = () => hasPopup() ? popupRoot.querySelector('.g').textContent : '';
  `);
  await evaluate(source);
  await evaluate('Promise.resolve()');
  return expression => evaluate(expression.includes('await ')
    ? `(async () => { ${expression} })()` : expression);
}

test('small movements on the same word preserve the original dwell deadline', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(600); move(document.querySelector('#one'),8); await tick(400)`);
  assert.equal(await run('requests.length'), 1);
});

test('hovering while the translation loads does not start duplicate requests', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); move(document.querySelector('#one'),8); await tick(1100)`);
  assert.equal(await run('requests.length'), 1);
});

test('another occurrence of the same word starts a fresh dwell and hides the old result', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); answer(0); await Promise.resolve(); await tick(50); move(document.querySelector('#two'))`);
  assert.equal(await run('hasPopup()'), false);
  await run('await tick(999)');
  assert.equal(await run('requests.length'), 1);
  await run('await tick(1)');
  assert.equal(await run('requests.length'), 2);
});

test('language changes discard an in-flight result and use the new language on next hover', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); await setOptions({targetLang:'fr'}); answer(0); await Promise.resolve()`);
  assert.equal(await run('hasPopup()'), false);
  await run(`move(document.querySelector('#one')); await tick(1000)`);
  assert.equal(await run('requests.at(-1).msg.tl'), 'fr');
});

test('disabling closes a loading popup immediately and late answers cannot reopen it', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); await setOptions({enabled:false}); answer(0); await Promise.resolve()`);
  assert.equal(await run('hasPopup()'), false);
});

test('a delayed settings response cannot restore an older language', async t => {
  const run = await page(t, { deferInitial: true });
  await run(`deferSettings=true; await setOptions({targetLang:'fr'}); await setOptions({targetLang:'es'});
    settingsReads.at(-1)?.({...options}); await Promise.resolve();
    settingsReads[0]?.({...options,targetLang:'fr'}); await Promise.resolve();
    move(document.querySelector('#one')); await tick(1000)`);
  assert.equal(await run('requests.at(-1).msg.tl'), 'es');
});

test('no text is translated before initial saved settings have loaded', async t => {
  const run = await page(t, { deferInitial: true });
  await run(`move(document.querySelector('#one')); await tick(1500)`);
  assert.equal(await run('requests.length'), 0);
  await run(`settingsReads[0]({...options,targetLang:'fr'}); await Promise.resolve(); move(document.querySelector('#one')); await tick(1000)`);
  assert.equal(await run('requests[0].msg.tl'), 'fr');
});

test('real caret hit testing reaches words inside nested open shadow roots', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#host').shadowRoot.querySelector('#inner').shadowRoot.querySelector('#shadow-word')); await tick(1000)`);
  assert.equal(await run('requests.length'), 1);
  assert.equal(await run('requests[0].msg.text'), 'nested');
});

test('moving into an editor cancels a pending hover before it sends text', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(600); move(document.querySelector('#editor span')); await tick(500)`);
  assert.equal(await run('requests.length'), 0);
  assert.equal(await run('hasPopup()'), false);
});

test('a loading popup is dismissed on entry into a shadow editor', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); await tick(50);
    move(document.querySelector('#host').shadowRoot.querySelector('#inner').shadowRoot.querySelector('#shadow-editor'));
    answer(0); await Promise.resolve()`);
  assert.equal(await run('hasPopup()'), false);
});

test('leaving the word during a request prevents a late popup', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000);
    document.documentElement.dispatchEvent(new MouseEvent('mouseleave')); answer(0); await Promise.resolve()`);
  assert.equal(await run('hasPopup()'), false);
});

test('selection hover preserves its dwell deadline through small movements', async t => {
  const run = await page(t);
  await run(`select(document.querySelector('#one')); move(document.querySelector('#one')); await tick(600); move(document.querySelector('#one'),8); await tick(400)`);
  assert.equal(await run('requests.length'), 1);
  assert.equal(await run('requests[0].msg.text'), 'hello world');
});

test('left mouse release translates the full selection immediately, right release does not', async t => {
  const run = await page(t);
  await run(`select(document.querySelector('#one')); document.querySelector('#one').dispatchEvent(new MouseEvent('mouseup',{button:2,bubbles:true})); await tick(10)`);
  assert.equal(await run('requests.length'), 0);
  await run(`document.querySelector('#one').dispatchEvent(new MouseEvent('mouseup',{button:0,bubbles:true})); await tick(8); answer(0); await Promise.resolve()`);
  assert.equal(await run('requests[0].msg.text'), 'hello world');
  assert.match(await run('popupContent()'), /Hallo/);
});

test('late answers from the previous word do not replace the current result', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); move(document.querySelector('#one'),90); await tick(1000);
    answer(1,'Welt'); await Promise.resolve(); answer(0,'Hallo'); await Promise.resolve()`);
  assert.equal(await run('requests.length'), 2);
  assert.match(await run('popupContent()'), /Welt/);
  assert.doesNotMatch(await run('popupContent()'), /Hallo/);
});

test('the last pointer movement inside the throttle window is eventually processed', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); answer(0); await Promise.resolve();
    move(document.querySelector('#one'),8); await tick(10); move(document.querySelector('#two')); await tick(38)`);
  assert.equal(await run('hasPopup()'), false);
  await run('await tick(1000)');
  assert.equal(await run('requests.length'), 2);
});

test('zero hover delay is preserved', async t => {
  const run = await page(t);
  await run(`await setOptions({hoverDelayMs:0}); move(document.querySelector('#one')); await tick(0)`);
  assert.equal(await run('requests.length'), 1);
});

test('shadow editor selections are never sent for translation on mouse release', async t => {
  const run = await page(t);
  await run(`const editor=document.querySelector('#host').shadowRoot.querySelector('#inner').shadowRoot.querySelector('#shadow-editor');
    select(editor); editor.dispatchEvent(new MouseEvent('mouseup',{button:0,bubbles:true,composed:true})); await tick(10)`);
  assert.equal(await run('requests.length'), 0);
});

test('a changed selection cannot display a stale translation', async t => {
  const run = await page(t);
  await run(`select(document.querySelector('#one')); document.querySelector('#one').dispatchEvent(new MouseEvent('mouseup',{button:0,bubbles:true})); await tick(8);
    select(document.querySelector('#two')); answer(0); await Promise.resolve()`);
  assert.equal(await run('hasPopup()'), false);
});

test('a word change just before the dwell deadline still starts the new word timer', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(960); move(document.querySelector('#one'),8);
    await tick(30); move(document.querySelector('#two')); await tick(2010)`);
  assert.equal(await run('requests.length'), 1);
  assert.equal(await run('requests[0].msg.text'), 'hello');
});

test('a late answer during a throttled word change does not cancel the next hover', async t => {
  const run = await page(t);
  await run(`move(document.querySelector('#one')); await tick(1000); move(document.querySelector('#one'),8);
    await tick(10); move(document.querySelector('#two')); answer(0); await Promise.resolve(); await tick(1100)`);
  assert.equal(await run('requests.length'), 2);
});

test('the right half of the last letter still belongs to its word', async t => {
  const run = await page(t);
  await run(`const range=document.createRange();range.setStart(document.querySelector('#one').firstChild,0);range.setEnd(document.querySelector('#one').firstChild,5);
    move(document.querySelector('#one'),range.getBoundingClientRect().width-2); await tick(1000)`);
  assert.equal(await run('requests.length'), 1);
  assert.equal(await run('requests[0].msg.text'), 'hello');
});

test('whitespace between words never triggers the adjacent word translation', async t => {
  const run = await page(t);
  await run(`const range=document.createRange();range.setStart(document.querySelector('#one').firstChild,0);range.setEnd(document.querySelector('#one').firstChild,5);
    move(document.querySelector('#one'),range.getBoundingClientRect().width+4); await tick(1000)`);
  assert.equal(await run('requests.length'), 0);
});
