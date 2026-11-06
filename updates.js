const copy = {
  de: {
    title: 'Glossa wurde aktualisiert.', status: 'Update installiert',
    intro: 'Die neue Version ist bereits installiert. Du kannst wie gewohnt weiterübersetzen.',
    ready: 'Bereit zum Übersetzen', notes: 'Das ist neu',
    store: 'Im Chrome Web Store ansehen ↗', github: 'Alle Versionshinweise ↗',
    hint: 'Alles erledigt. Du kannst diesen Tab schließen.', footer: 'Einfach lesen. Einfach verstehen.',
  },
  en: {
    title: 'Glossa has been updated.', status: 'Update installed',
    intro: 'The new version is already installed. You can keep translating as usual.',
    ready: 'Ready to translate', notes: "What's new",
    store: 'View in Chrome Web Store ↗', github: 'All release notes ↗',
    hint: 'All done. You can close this tab.', footer: 'Keep reading. Keep understanding.',
  },
};
const $ = id => document.getElementById(id);
let language = (globalThis.chrome?.i18n?.getUILanguage?.() || navigator.language).startsWith('de') ? 'de' : 'en';
const entries = [...document.querySelectorAll('#release-notes li[data-en]')];
for (const item of entries) item.dataset.de = item.textContent;
const version = globalThis.chrome?.runtime?.getManifest?.().version ||
  document.querySelector('[data-release-version]')?.dataset.releaseVersion || '';

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
  for (const item of entries) item.textContent = item.dataset[language];
}

$('language').addEventListener('click', () => {
  language = language === 'de' ? 'en' : 'de';
  render();
});

render();
