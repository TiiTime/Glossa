const DEFAULTS = {
  targetLang: 'de',
  sourceLang: 'auto',
  hoverDelayMs: 1000,
  enabled: true,
};

const $ = (id) => document.getElementById(id);

const LANG_CODES = new Set(GLOSSA_LANGUAGES.map((l) => l.code));

function populateLanguages() {
  const sel = $('targetLang');
  sel.replaceChildren();
  for (const { code, name } of GLOSSA_LANGUAGES) {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = name;
    sel.appendChild(opt);
  }
}

function normalizeLang(code) {
  return LANG_CODES.has(code) ? code : DEFAULTS.targetLang;
}

async function load() {
  populateLanguages();
  try {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    $('enabled').checked = stored.enabled !== false;
    $('targetLang').value = normalizeLang(stored.targetLang || DEFAULTS.targetLang);
    $('hoverDelayMs').value = stored.hoverDelayMs ?? 1000;
  } catch {
    $('targetLang').value = DEFAULTS.targetLang;
  }
}

$('save').addEventListener('click', async () => {
  const data = {
    enabled: $('enabled').checked,
    targetLang: normalizeLang($('targetLang').value),
    sourceLang: 'auto',
    hoverDelayMs: Math.max(0, Math.min(3000, parseInt($('hoverDelayMs').value, 10) || 1000)),
  };
  const status = $('status');
  try {
    await chrome.storage.sync.set(data);
    status.textContent = 'Gespeichert';
    status.classList.remove('error');
  } catch (e) {
    status.textContent = 'Fehler beim Speichern';
    status.classList.add('error');
  }
  setTimeout(() => {
    status.textContent = '';
  }, 1500);
});

load();
