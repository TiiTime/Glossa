const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const { delay, until, connect } = require('./helpers/cdp.cjs');

test('actual version upgrade opens the offline update page once, with correct release notes', { timeout: 30000 }, async t => {
  const root = path.resolve(__dirname, '..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'glossa-upgrade-'));
  const extension = path.join(temp, 'extension');
  const profile = path.join(temp, 'profile');
  fs.mkdirSync(extension);
  const files = ['manifest.json','background.js','content.js','popup.html','popup.js','languages.js',
    'updates.html','updates.css','updates.js','release-notes.json'];
  for (const file of files) fs.copyFileSync(path.join(root,file),path.join(extension,file));
  fs.cpSync(path.join(root,'icons'),path.join(extension,'icons'),{recursive:true});
  const currentManifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
  fs.writeFileSync(path.join(extension,'manifest.json'), JSON.stringify({...currentManifest,version:'1.0.11'}));
  const browser = spawn('C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',[
    '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',
    `--user-data-dir=${profile}`,`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'about:blank',
  ],{windowsHide:true,stdio:'ignore'});
  const connections=[];
  t.after(async()=>{
    for(const connection of connections)connection.close();
    const exited=once(browser,'exit');browser.kill();await exited;
    fs.rmSync(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  });
  const activePort=path.join(profile,'DevToolsActivePort');
  await until(()=>fs.existsSync(activePort),'debugging port');
  const port=Number(fs.readFileSync(activePort,'utf8').split('\n')[0]);
  const targets=()=>fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
  async function findWorker() {
    const target=await until(async()=> (await targets()).find(item=>item.type==='service_worker'&&item.url.endsWith('/background.js')),'extension worker');
    const connection=await connect(target.webSocketDebuggerUrl);connections.push(connection);
    await connection.send('Runtime.enable');
    await until(()=>connection.evaluate(`typeof chrome!=='undefined'&&!!chrome.storage?.local`),'worker initialized');
    return {target,connection};
  }
  let worker=await findWorker();
  await delay(250);
  assert.equal((await targets()).filter(item=>item.url.endsWith('/updates.html')).length,0,'first install opens no tab');

  // Unpacked reloads require Developer mode, even when command-line loading was allowed.
  const managerTarget=await (await fetch(`http://127.0.0.1:${port}/json/new?chrome://extensions`,{method:'PUT'})).json();
  const manager=await connect(managerTarget.webSocketDebuggerUrl);connections.push(manager);
  await until(()=>manager.evaluate(`!!chrome.developerPrivate`),'extension manager initialized');
  await manager.evaluate(`chrome.developerPrivate.updateProfileConfiguration({inDeveloperMode:true})`);

  fs.writeFileSync(path.join(extension,'manifest.json'),JSON.stringify(currentManifest));
  const extensionId=new URL(worker.target.url).host;
  worker.connection.close();
  await manager.evaluate(`chrome.developerPrivate.reload(${JSON.stringify(extensionId)},{failQuietly:true,populateErrorForUnpacked:true})`);
  await delay(350);
  worker=await findWorker(worker.target.id);
  const updateTarget=await until(async()=> (await targets()).find(item=>item.url.endsWith('/updates.html')),'automatic update tab');
  const page=await connect(updateTarget.webSocketDebuggerUrl);connections.push(page);
  const releaseData=JSON.parse(fs.readFileSync(path.join(root,'release-notes.json'),'utf8'));
  // Release history must be actual HTML, readable even without script execution.
  await page.send('Emulation.setScriptExecutionDisabled',{value:true});
  await page.send('Page.reload');
  await delay(100);
  assert.equal(await page.evaluate(`document.querySelectorAll('.release-group').length`),releaseData.releases.length);
  assert.deepEqual(await page.evaluate(`[...document.querySelectorAll('#release-notes li')].map(item=>item.textContent)`),releaseData.releases.flatMap(release=>release.de));
  assert.match(await page.evaluate(`document.querySelector('#release-notes').textContent`),/Wartezeit/);
  await page.send('Emulation.setScriptExecutionDisabled',{value:false});
  await page.send('Page.reload');
  const errors=[];
  page.on('Runtime.exceptionThrown',({exceptionDetails})=>errors.push(exceptionDetails.text));
  await page.send('Runtime.enable');
  await until(()=>page.evaluate(`document.querySelectorAll('.release-group').length===${releaseData.releases.length}`),'release notes rendered');
  await until(()=>page.evaluate(`document.querySelector('#version').textContent==='Glossa ${currentManifest.version}'`),'page language initialized');
  await page.evaluate(`document.getElementById('language').textContent.includes('Deutsch')&&document.getElementById('language').click()`);
  assert.equal(await page.evaluate(`document.querySelector('h1').textContent`),'Glossa wurde aktualisiert.');
  assert.equal(await page.evaluate(`document.querySelector('#version').textContent`),`Glossa ${currentManifest.version}`);
  assert.match(await page.evaluate(`document.querySelector('#release-notes').textContent`),/einmal pro neuer Version/);
  assert.equal(await page.evaluate(`document.querySelector('#store').href`),'https://chromewebstore.google.com/detail/glossa/jopklcgamodpahihakgiogohpiaafamm');
  await page.evaluate(`document.querySelector('#language').click()`);
  assert.equal(await page.evaluate(`document.querySelector('h1').textContent`),'Glossa has been updated.');
  assert.equal(await page.evaluate(`document.documentElement.lang`),'en');
  assert.deepEqual(await page.evaluate(`[...document.querySelectorAll('#release-notes li')].map(item=>item.textContent)`),releaseData.releases.flatMap(release=>release.en));
  assert.deepEqual(errors,[]);
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert.equal(await page.evaluate(`document.documentElement.scrollWidth<=innerWidth`),true,'mobile layout has no horizontal overflow');
  await page.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await page.evaluate(`document.querySelector('#language').click()`);
  if(process.env.GLOSSA_SCREENSHOT) {
    const screenshot=await page.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
    fs.writeFileSync(process.env.GLOSSA_SCREENSHOT,Buffer.from(screenshot.data,'base64'));
  }
  const stored=await worker.connection.evaluate(`chrome.storage.local.get('lastUpdateNoticeVersion')`);
  assert.equal(stored.lastUpdateNoticeVersion,currentManifest.version);
  await fetch(`http://127.0.0.1:${port}/json/close/${updateTarget.id}`);
  worker.connection.close();
  await manager.evaluate(`chrome.developerPrivate.reload(${JSON.stringify(extensionId)},{failQuietly:true,populateErrorForUnpacked:true})`);
  await delay(250);
  worker=await findWorker(worker.target.id);
  await delay(250);
  assert.equal((await targets()).filter(item=>item.url.endsWith('/updates.html')).length,0,'same version reload opens no second tab');
  const fileUrl=pathToFileURL(path.join(extension,'updates.html')).href;
  const localTarget=await (await fetch(`http://127.0.0.1:${port}/json/new?${fileUrl}`,{method:'PUT'})).json();
  const localPage=await connect(localTarget.webSocketDebuggerUrl);connections.push(localPage);
  await until(()=>localPage.evaluate(`document.querySelector('#version')?.textContent==='Glossa ${currentManifest.version}'`),'direct HTML file initializes without fetch');
  assert.equal(await localPage.evaluate(`document.querySelectorAll('.release-group').length`),releaseData.releases.length);
});
