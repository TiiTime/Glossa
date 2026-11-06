const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

test('packaging refuses release notes for another version before replacing the previous ZIP', t => {
  const root=path.resolve(__dirname,'..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'glossa-package-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  fs.mkdirSync(path.join(temp,'scripts'));fs.mkdirSync(path.join(temp,'dist'));
  for(const name of ['manifest.json','background.js','content.js','popup.html','popup.js','languages.js',
    'updates.html','updates.css','updates.js','release-notes.json','LICENSE']) fs.copyFileSync(path.join(root,name),path.join(temp,name));
  fs.cpSync(path.join(root,'icons'),path.join(temp,'icons'),{recursive:true});
  fs.copyFileSync(path.join(root,'scripts/build-release.ps1'),path.join(temp,'scripts/build-release.ps1'));
  fs.copyFileSync(path.join(root,'scripts/sync-update-notes.ps1'),path.join(temp,'scripts/sync-update-notes.ps1'));
  const notes=JSON.parse(fs.readFileSync(path.join(temp,'release-notes.json'),'utf8'));
  notes.version='0.0.1';fs.writeFileSync(path.join(temp,'release-notes.json'),JSON.stringify(notes));
  const archive=path.join(temp,'dist/glossa-extension.zip');fs.writeFileSync(archive,'previous release');
  const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(temp,'scripts/build-release.ps1')],{encoding:'utf8',windowsHide:true});
  assert.notEqual(result.status,0);
  assert.equal(fs.readFileSync(archive,'utf8'),'previous release');
});
