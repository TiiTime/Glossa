const copy = {
  de: {
    title: 'Glossa wurde aktualisiert.', status: 'Update installiert',
    intro: 'Die neue Version ist bereits installiert. Du kannst wie gewohnt weiterübersetzen.',
    ready: 'Bereit zum Übersetzen', notes: 'Das ist neu', earlier: 'Außerdem aus',
    store: 'Im Chrome Web Store ansehen ↗', github: 'Alle Versionshinweise ↗',
    hint: 'Alles erledigt. Du kannst diesen Tab schließen.', footer: 'Einfach lesen. Einfach verstehen.',
    unavailable: 'Die Versionshinweise konnten nicht geladen werden. Alle Änderungen findest du auf GitHub.',
  },
  en: {
    title: 'Glossa has been updated.', status: 'Update installed',
    intro: 'The new version is already installed. You can keep translating as usual.',
    ready: 'Ready to translate', notes: "What's new", earlier: 'Also from',
    store: 'View in Chrome Web Store ↗', github: 'All release notes ↗',
    hint: 'All done. You can close this tab.', footer: 'Keep reading. Keep understanding.',
    unavailable: 'Release notes could not be loaded. You can find all changes on GitHub.',
  },
};
const $ = id => document.getElementById(id);
let language = (globalThis.chrome?.i18n?.getUILanguage?.() || navigator.language).startsWith('de') ? 'de' : 'en';
let releaseNotes = null;
let version = '';

function render() {
  const text = copy[language];
  document.documentElement.lang = language;
  document.title = text.title;
  $('title').textContent = text.title;
  $('status').textContent = text.status;
  $('intro').textContent = text.intro;
  $('version').textContent = version ? `Glossa ${version}` : 'Glossa';
  $('version-label').textContent = text.ready;
  $('notes-title').textContent = text.notes;
  for (const id of ['store', 'github', 'hint', 'footer']) $(id).textContent = text[id];
  $('language').textContent = language === 'de' ? 'English ↗' : 'Deutsch ↗';
  $('language').setAttribute('aria-label', language === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln');
  const notes = $('release-notes');
  notes.replaceChildren();
  if (!releaseNotes || releaseNotes.version !== version) {
    const message = document.createElement('p');
    message.textContent = text.unavailable;
    notes.append(message);
    return;
  }
  for (const release of releaseNotes.releases) {
    const group = document.createElement('section');
    group.className = 'release-group';
    const heading = document.createElement('h3');
    heading.textContent = release.version === version ? `Version ${release.version}` : `${text.earlier} ${release.version}`;
    const list = document.createElement('ul');
    for (const change of release[language]) {
      const item = document.createElement('li');
      item.textContent = change;
      list.append(item);
    }
    group.append(heading, list);
    notes.append(group);
  }
}

$('language').addEventListener('click', () => {
  language = language === 'de' ? 'en' : 'de';
  render();
});

(async () => {
  try {
    const manifest = globalThis.chrome?.runtime?.getManifest?.() || await (await fetch('manifest.json')).json();
    version = manifest.version;
    const response = await fetch('release-notes.json');
    if (!response.ok) throw new Error('Release notes unavailable');
    releaseNotes = await response.json();
  } catch {
    releaseNotes = null;
  }
  render();
})();
