const POPUP_ID = 'glossa-host';
const WORD_CHARS = /[\p{L}\p{M}\p{N}'’\-]/u;
const HOVER_MS = 1000;
const MOVE_THROTTLE_MS = 48;

let settings = { targetLang: 'de', sourceLang: 'auto', hoverDelayMs: HOVER_MS, enabled: true };
let hoverTimer = 0;
let lastMoveAt = 0;
let stickyWord = '';
let stickySelection = '';
let popupText = '';
let popupHost = null;
let popupEl = null;
let pendingRequest = 0;
let loading = false;
let lastX = 0;
let lastY = 0;
let pointerInside = false;

function runtimeSend(msg) {
  return new Promise((resolve, reject) => {
    if (!chrome.runtime?.id) {
      reject(new Error('context_invalidated'));
      return;
    }
    try {
      chrome.runtime.sendMessage(msg, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message || 'no_receiver'));
          return;
        }
        resolve(response);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function loadSettings() {
  try {
    settings = await runtimeSend({ type: 'getSettings' });
  } catch {
    /* defaults */
  }
  if (!settings.enabled) hidePopupNow();
}

loadSettings();
chrome.storage.onChanged.addListener((_, area) => {
  if (area === 'sync') loadSettings();
});

function isEditable(el) {
  if (!el || el.nodeType !== 1) return false;
  const t = el.tagName;
  return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable;
}

function selectionInEditable() {
  const sel = window.getSelection();
  const anchor = sel?.anchorNode;
  if (!anchor) return false;
  const el = anchor.nodeType === 3 ? anchor.parentElement : anchor;
  if (!el || el.nodeType !== 1) return false;
  return isEditable(el) || !!el.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]');
}

function caretRangeAtPoint(x, y, root) {
  const doc = root?.ownerDocument || document;
  // ShadowRoot has no caretRangeFromPoint — pierce via caretPositionFromPoint options.
  if (root?.nodeType === 11 && typeof doc.caretPositionFromPoint === 'function') {
    try {
      const pos = doc.caretPositionFromPoint(x, y, { shadowRoots: [root] });
      if (pos?.offsetNode) {
        const r = doc.createRange();
        r.setStart(pos.offsetNode, pos.offset);
        r.collapse(true);
        return r;
      }
    } catch {
      /* older Chromium without shadowRoots option */
    }
  }
  if (root?.nodeType === 11 && root.caretRangeFromPoint) return root.caretRangeFromPoint(x, y);
  if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
  const pos = doc.caretPositionFromPoint?.(x, y);
  if (!pos) return null;
  const r = doc.createRange();
  r.setStart(pos.offsetNode, pos.offset);
  r.collapse(true);
  return r;
}

function expandRangeToWord(range) {
  const node = range.startContainer;
  if (node.nodeType !== 3) return null;
  const text = node.nodeValue || '';
  let start = range.startOffset;
  let end = range.startOffset;
  while (start > 0 && WORD_CHARS.test(text[start - 1])) start--;
  while (end < text.length && WORD_CHARS.test(text[end])) end++;
  if (start === end) return null;
  const word = text.slice(start, end).replace(/^[\s"'«»]+|[\s"'«»]+$/g, '');
  if (!word) return null;
  const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(word);
  if (word.length < (cjk ? 1 : 2) || !/[\p{L}\p{N}]/u.test(word)) return null;
  const out = document.createRange();
  out.setStart(node, start);
  out.setEnd(node, end);
  return { range: out, word };
}

/** Cursor must sit on a word glyph, not whitespace snapped to a nearby word. */
function pointOverRange(x, y, range) {
  for (const rect of range.getClientRects()) {
    if (x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom) {
      return true;
    }
  }
  return false;
}

function wordAtPoint(x, y, root) {
  const range = caretRangeAtPoint(x, y, root);
  if (!range) return null;
  const node = range.startContainer;
  if (node.nodeType !== 3) return null;
  const text = node.nodeValue || '';
  let off = range.startOffset;
  if (off >= text.length) off = text.length - 1;
  if (off < 0) return null;
  const ch = text[off];
  if (!ch || !WORD_CHARS.test(ch)) return null;
  const hit = expandRangeToWord(range);
  if (!hit || !pointOverRange(x, y, hit.range)) return null;
  return hit;
}

/** Fast path — caret only, no TreeWalker (hot path for leave detection). */
function fastWordAt(x, y) {
  return wordAtPoint(x, y, document);
}

function findTextRangeAtPoint(x, y) {
  const hit = fastWordAt(x, y);
  if (hit) return hit;
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  let node = el;
  while (node) {
    if (node.shadowRoot) {
      const w = wordAtPoint(x, y, node.shadowRoot);
      if (w) return w;
    }
    node = node.parentNode || node.host;
  }
  return null;
}

function getSelectionHover(x, y) {
  const sel = window.getSelection();
  if (!sel?.toString().trim() || sel.isCollapsed || !sel.rangeCount) return null;
  const text = sel.toString().trim();
  if (text.length < 2) return null;
  const range = sel.getRangeAt(0);
  for (const rect of range.getClientRects()) {
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return { text, rect: range.getBoundingClientRect() };
    }
  }
  return null;
}

function getSelectedText() {
  const sel = window.getSelection();
  if (!sel?.toString().trim() || sel.isCollapsed) return null;
  const text = sel.toString().trim();
  if (text.length < 2) return null;
  return { text, rect: sel.getRangeAt(0).getBoundingClientRect() };
}

function ensurePopup() {
  if (popupHost?.isConnected) return;
  popupHost = document.createElement('div');
  popupHost.id = POPUP_ID;
  popupHost.style.cssText = 'all:initial;position:fixed;z-index:2147483647;pointer-events:none;top:0;left:0';
  const shadow = popupHost.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `<style>
    .g{font:14px/1.4 "Segoe UI",system-ui,sans-serif;color:#cdd6f4;background:#1e1e2e;border:1px solid rgba(137,180,250,.35);border-radius:8px;padding:8px 10px;max-width:min(340px,92vw);max-height:min(60vh,420px);overflow:auto;box-shadow:0 8px 28px rgba(0,0,0,.4);pointer-events:auto}
    .w{font-weight:600;color:#cdd6f4;font-size:14px;margin-bottom:4px}
    .o{color:#89b4fa;font-size:12px;opacity:.9}
    .d{margin-top:6px;font-size:12px;color:#a6adc8}.p{font-weight:600;color:#cba6f7}
    .e{color:#f38ba8}.l{color:#a6adc8;font-style:italic}
  </style><div class="g"></div>`;
  popupEl = shadow.querySelector('.g');
  (document.documentElement || document.body).appendChild(popupHost);
}

function hidePopupNow() {
  clearTimeout(hoverTimer);
  hoverTimer = 0;
  if (loading) pendingRequest++;
  loading = false;
  popupText = '';
  stickyWord = '';
  stickySelection = '';
  if (popupHost?.isConnected) {
    popupHost.remove();
    popupHost = null;
    popupEl = null;
  }
}

function placePopup(rect, cx, cy) {
  const pad = 10;
  const w = Math.min(340, innerWidth - pad * 2);
  const h = popupEl?.getBoundingClientRect().height || 140;
  let left = cx + pad;
  let top = (rect?.bottom ?? cy) + pad;
  if (left + w > innerWidth - pad) left = innerWidth - w - pad;
  if (top + h > innerHeight - pad) top = (rect?.top ?? cy) - h - pad;
  popupHost.style.left = `${Math.max(pad, left)}px`;
  popupHost.style.top = `${Math.max(pad, Math.min(top, innerHeight - h - pad))}px`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function labelText(t) {
  return t.length > 72 ? `${t.slice(0, 69)}…` : t;
}

function showLoading(word, rect, cx, cy) {
  ensurePopup();
  popupEl.innerHTML = `<div class="l">…</div><div class="o">${esc(labelText(word))}</div>`;
  placePopup(rect, cx, cy);
}

function showResult(data, rect, cx, cy) {
  ensurePopup();
  let h = `<div class="w">${esc(data.translation)}</div><div class="o">${esc(labelText(data.word))}</div>`;
  if (data.dict?.length) {
    h += '<div class="d">';
    for (const row of data.dict.slice(0, 2)) {
      h += `<div><span class="p">${esc(row.pos)}</span> ${esc(row.meanings.slice(0, 4).join(', '))}</div>`;
    }
    h += '</div>';
  }
  popupEl.innerHTML = h;
  placePopup(rect, cx, cy);
  popupText = data.word;
}

function showError(word, msg, rect, cx, cy) {
  ensurePopup();
  popupEl.innerHTML = `<div class="w">${esc(labelText(word))}</div><div class="e">${esc(msg)}</div>`;
  placePopup(rect, cx, cy);
}

async function requestTranslate(text, rect, cx, cy) {
  const req = ++pendingRequest;
  loading = true;
  showLoading(text, rect, cx, cy);
  try {
    const result = await runtimeSend({
      type: 'translate',
      text,
      tl: settings.targetLang,
      sl: settings.sourceLang,
    });
    if (req !== pendingRequest) return;
    loading = false;
    if (!result) {
      showError(text, 'Keine Antwort — Seite neu laden (F5)', rect, cx, cy);
      return;
    }
    if (result.ok) showResult(result, rect, cx, cy);
    else {
      const msg =
        result.error === 'not_found'
          ? 'Keine Übersetzung'
          : result.error === 'disabled'
            ? 'Glossa ist aus'
            : result.error === 'too_long'
              ? 'Text zu lang'
              : 'Fehlgeschlagen';
      showError(text, msg, rect, cx, cy);
    }
  } catch (e) {
    if (req !== pendingRequest) return;
    loading = false;
    const m = String(e?.message || '');
    const hint = m.includes('invalidated') || m.includes('Receiving end')
      ? 'Glossa neu laden: F5 auf dieser Seite'
      : 'Verbindung fehlgeschlagen';
    showError(text, hint, rect, cx, cy);
  }
}

function scheduleSelectionHover(x, y, selHit) {
  clearTimeout(hoverTimer);
  const delay = settings.hoverDelayMs ?? HOVER_MS;
  const text = selHit.text;
  if (popupText === text) return;
  hoverTimer = setTimeout(() => {
    hoverTimer = 0;
    if (!settings.enabled || !pointerInside) return;
    if (popupText === text) return;
    const again = getSelectionHover(lastX, lastY);
    if (!again || again.text !== text) return;
    requestTranslate(text, again.rect, lastX, lastY);
  }, delay);
}

function scheduleHover(x, y) {
  clearTimeout(hoverTimer);
  const delay = settings.hoverDelayMs ?? HOVER_MS;
  hoverTimer = setTimeout(() => {
    hoverTimer = 0;
    if (!settings.enabled || !pointerInside) return;
    const hit = findTextRangeAtPoint(lastX, lastY);
    if (!hit || hit.word !== stickyWord) return;
    if (popupText === hit.word) return;
    const rect = hit.range.getBoundingClientRect();
    requestTranslate(hit.word, rect, lastX, lastY);
  }, delay);
}

function onMouseMove(e) {
  if (!settings.enabled) return;
  pointerInside = true;
  const now = Date.now();
  if (now - lastMoveAt < MOVE_THROTTLE_MS) return;
  lastMoveAt = now;

  const x = e.clientX;
  const y = e.clientY;
  lastX = x;
  lastY = y;

  if (isEditable(e.target)) {
    if (popupText) hidePopupNow();
    return;
  }

  const selHit = getSelectionHover(x, y);
  if (selHit) {
    if (popupText && popupText !== selHit.text) hidePopupNow();
    else if (stickySelection && stickySelection !== selHit.text) hidePopupNow();
    stickySelection = selHit.text;
    stickyWord = '';
    scheduleSelectionHover(x, y, selHit);
    return;
  }

  // Leaving a selection hover — clear selection sticky only (do not wipe word popup yet).
  if (stickySelection) hidePopupNow();
  stickySelection = '';

  const hit = fastWordAt(x, y);
  const word = hit?.word || '';

  if (popupText && popupText !== word) hidePopupNow();
  else if (!word && stickyWord) hidePopupNow();
  else if (word && stickyWord && word !== stickyWord) hidePopupNow();

  stickyWord = word;
  if (!word) {
    clearTimeout(hoverTimer);
    hoverTimer = 0;
    return;
  }

  scheduleHover(x, y);
}

function onMouseDown() {
  clearTimeout(hoverTimer);
  hoverTimer = 0;
}

function onSelectionFinish() {
  if (!settings.enabled) return;
  if (selectionInEditable()) return;
  const sel = getSelectedText();
  if (!sel) return;
  hidePopupNow();
  stickyWord = '';
  stickySelection = sel.text;
  const cx = sel.rect.left + sel.rect.width / 2;
  requestTranslate(sel.text, sel.rect, cx, sel.rect.bottom);
}

function onPointerLeave() {
  pointerInside = false;
  hidePopupNow();
}

document.addEventListener('mousemove', onMouseMove, { capture: true, passive: true });
document.documentElement.addEventListener('mouseleave', onPointerLeave, { passive: true });
window.addEventListener('blur', onPointerLeave);
document.addEventListener('mousedown', onMouseDown, true);
document.addEventListener(
  'mouseup',
  (e) => {
    if (e.button === 0) setTimeout(onSelectionFinish, 8);
  },
  true,
);
document.addEventListener('scroll', hidePopupNow, { capture: true, passive: true });
addEventListener('resize', hidePopupNow, { passive: true });
document.addEventListener('keydown', (e) => e.key === 'Escape' && hidePopupNow(), true);
