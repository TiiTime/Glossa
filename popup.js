const DEFAULTS = {
  targetLang: 'de',
  sourceLang: 'auto',
  hoverDelayMs: 1000,
  enabled: true,
};

const $ = (id) => document.getElementById(id);

async function load() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  $('enabled').checked = stored.enabled !== false;
  $('targetLang').value = stored.targetLang || 'de';
  $('hoverDelayMs').value = stored.hoverDelayMs ?? 1000;
}

$('save').addEventListener('click', async () => {
  const data = {
    enabled: $('enabled').checked,
    targetLang: $('targetLang').value,
    sourceLang: 'auto',
    hoverDelayMs: Math.max(0, Math.min(3000, parseInt($('hoverDelayMs').value, 10) || 1000)),
  };
  await chrome.storage.sync.set(data);
  $('status').textContent = 'Gespeichert';
  setTimeout(() => {
    $('status').textContent = '';
  }, 1500);
});

load();
