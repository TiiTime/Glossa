const CACHE_MAX = 120;
const cache = new Map();

const DEFAULTS = {
  targetLang: 'de',
  sourceLang: 'auto',
  hoverDelayMs: 1000,
  enabled: true,
};

async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

function cacheKey(text, sl, tl) {
  return `${sl}|${tl}|${text}`;
}

function getCached(text, sl, tl) {
  const key = cacheKey(text, sl, tl);
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > 1000 * 60 * 60) {
    cache.delete(key);
    return null;
  }
  // Bump recency so frequently reused entries survive eviction (true LRU, not just FIFO).
  cache.delete(key);
  cache.set(key, hit);
  return hit.data;
}

function setCache(text, sl, tl, data) {
  const key = cacheKey(text, sl, tl);
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, { at: Date.now(), data });
}

function parseGoogleResponse(json, original) {
  if (!json) return { ok: false, error: 'empty' };

  let detected = 'auto';
  const lines = [];
  const dict = [];

  if (Array.isArray(json)) {
    if (json[2]) detected = json[2];
    if (Array.isArray(json[0])) {
      for (const part of json[0]) {
        if (part?.[0]) lines.push(part[0]);
      }
    }
    if (Array.isArray(json[1])) {
      for (const entry of json[1]) {
        const pos = entry?.[0] || '';
        const meanings = (entry?.[2] || []).slice(0, 6);
        if (meanings.length) dict.push({ pos, meanings });
      }
    }
  } else {
    detected = json.src || json.ld_result?.srclangs?.[0] || 'auto';
    if (Array.isArray(json.sentences)) {
      for (const s of json.sentences) {
        if (s.trans) lines.push(s.trans);
      }
    }
    if (Array.isArray(json.dict)) {
      for (const entry of json.dict) {
        const pos = entry.pos || '';
        const meanings = (entry.entry || [])
          .map((e) => e.word || e.reverse_translation?.[0] || '')
          .filter(Boolean);
        if (meanings.length) dict.push({ pos, meanings: meanings.slice(0, 6) });
      }
    }
  }

  const translation = lines.join('').trim();
  if (!translation && dict.length === 0) {
    return { ok: false, error: 'not_found', word: original };
  }

  return {
    ok: true,
    word: original,
    translation: translation || dict.flatMap((d) => d.meanings).slice(0, 4).join(', '),
    dict,
    detectedLang: detected,
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json,text/plain,*/*' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function translateViaApi(text, sl, tl, client) {
  const q = encodeURIComponent(text.trim());
  const base =
    client === 'dict'
      ? `https://clients5.google.com/translate_a/single?client=dict-chrome-ex&sl=${sl}&tl=${tl}&dt=t&dt=bd&dt=ld&dj=1&q=${q}`
      : `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&dj=1&q=${q}`;

  const json = await fetchJson(base);
  return parseGoogleResponse(json, text);
}

async function translateText(text, sl, tl) {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'empty' };
  if (trimmed.length > 2000) return { ok: false, error: 'too_long' };

  const cached = getCached(trimmed, sl, tl);
  if (cached) return { ...cached, cached: true };

  const apis = ['gtx', 'dict'];
  let lastError = 'not_found';

  for (const api of apis) {
    try {
      const result = await translateViaApi(trimmed, sl, tl, api);
      if (result.ok) {
        setCache(trimmed, sl, tl, result);
        return result;
      }
      lastError = result.error || lastError;
    } catch (e) {
      lastError = e.message || 'network';
    }
  }

  return { ok: false, error: lastError, word: trimmed };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'ping') {
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'translate') {
    (async () => {
      try {
        const settings = await getSettings();
        if (!settings.enabled) {
          sendResponse({ ok: false, error: 'disabled' });
          return;
        }
        const sl = msg.sl || settings.sourceLang || 'auto';
        const tl = msg.tl || settings.targetLang || 'de';
        const result = await translateText(msg.text, sl, tl);
        sendResponse(result);
      } catch (e) {
        sendResponse({ ok: false, error: e.message || 'background_error' });
      }
    })();
    return true;
  }

  if (msg.type === 'getSettings') {
    getSettings()
      .then((s) => sendResponse(s))
      .catch((e) => sendResponse({ ...DEFAULTS, error: e.message }));
    return true;
  }

  return false;
});
