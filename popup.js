const DEFAULTS = {
  targetLang: 'de',
  sourceLang: 'auto',
  hoverDelayMs: 1000,
  enabled: true,
};

const $ = (id) => document.getElementById(id);

async function load() {
  try {
    const stored = await chrome.storage.sync.get(DEFAULTS);
    $('enabled').checked = stored.enabled !== false;
    $('targetLang').value = stored.targetLang || 'de';
    $('hoverDelayMs').value = stored.hoverDelayMs ?? 1000;
  } catch {
    /* keep the defaults already set in the HTML */
  }
}

$('save').addEventListener('click', async () => {
  const data = {
    enabled: $('enabled').checked,
    targetLang: $('targetLang').value,
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
