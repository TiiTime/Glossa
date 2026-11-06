const POPUP_ID = 'glossa-host';
const WORD_CHARS = /[\p{L}\p{M}\p{N}'’\-]/u;
const HOVER_MS = 1000;
const MOVE_THROTTLE_MS = 48;

let settings = { targetLang: 'de', sourceLang: 'auto', hoverDelayMs: HOVER_MS, enabled: true };
let hoverTimer = 0;
let lastMoveAt = 0;
let activeTarget = null;
let popupText = '';
let popupHost = null;
let popupEl = null;
let pendingRequest = 0;
let loading = false;
let lastX = 0;
let lastY = 0;
let pointerInside = false;
let moveTimer = 0;
let settingsRevision = 0;
let settingsReady = false;

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
  const revision = ++settingsRevision;
  try {
    const stored = await runtimeSend({ type: 'getSettings' });
    if (revision !== settingsRevision) return;
    settings = { ...settings, ...stored };
  } catch {
    /* defaults */
  }
  if (revision !== settingsRevision) return;
  settingsReady = true;
  if (!settings.enabled) hidePopupNow();
}

loadSettings();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  const defaults = { targetLang: 'de', sourceLang: 'auto', hoverDelayMs: HOVER_MS, enabled: true };
  const keys = Object.keys(defaults).filter(key => key in changes);
  if (!keys.length) return;
  // Invalidate synchronously: an older settings read or translation may still be pending.
  settingsRevision++;
  for (const key of keys) settings[key] = changes[key].newValue ?? defaults[key];
  hidePopupNow();
  // If startup is still pending, reload the complete settings snapshot.
  if (!settingsReady) loadSettings();
});

function isEditable(el) {
  if (el?.nodeType === 3) el = el.parentElement;
  while (el?.nodeType === 1) {
    const t = el.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable) return true;
    el = el.parentElement || el.getRootNode()?.host;
  }
  return false;
}

function selectionInEditable() {
  const sel = window.getSelection();
  return isEditable(sel?.anchorNode) || isEditable(sel?.focusNode);
}

function caretRangeAtPoint(x, y, shadowRoots = []) {
  if (shadowRoots.length && typeof document.caretPositionFromPoint === 'function') {
    try {
      const pos = document.caretPositionFromPoint(x, y, { shadowRoots });
      if (pos?.offsetNode) {
        const r = document.createRange();
        r.setStart(pos.offsetNode, pos.offset);
        r.collapse(true);
        return r;
      }
    } catch {
      /* older Chromium without shadowRoots option */
    }
  }
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
  const pos = document.caretPositionFromPoint?.(x, y);
  if (!pos) return null;
  const r = document.createRange();
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

function wordAtPoint(x, y, shadowRoots) {
  const range = caretRangeAtPoint(x, y, shadowRoots);
  if (!range) return null;
  const node = range.startContainer;
  if (node.nodeType !== 3 || isEditable(node)) return null;
  const text = node.nodeValue || '';
  let off = range.startOffset;
  if (off >= text.length) off = text.length - 1;
  // Caret APIs can snap the right half of a final glyph to the following space.
  // Validate the actual word rectangle below so whitespace itself stays ignored.
  if (!WORD_CHARS.test(text[off] || '') && off > 0) off--;
  if (off < 0) return null;
  const ch = text[off];
  if (!ch || !WORD_CHARS.test(ch)) return null;
  range.setStart(node, off);
  const hit = expandRangeToWord(range);
  if (!hit || !pointOverRange(x, y, hit.range)) return null;
  return hit;
}

function pointContext(x, y) {
  let element = document.elementFromPoint(x, y);
  const shadowRoots = [];
  while (element?.shadowRoot) {
    const root = element.shadowRoot;
    shadowRoots.push(root);
    const inner = root.elementFromPoint(x, y);
    if (!inner || inner === element) break;
    element = inner;
  }
  return { element, shadowRoots };
}

function findTextRangeAtPoint(x, y) {
  const { element, shadowRoots } = pointContext(x, y);
  if (!element || isEditable(element)) return null;
  return wordAtPoint(x, y, shadowRoots);
}

function getSelectionHover(x, y) {
  if (selectionInEditable() || isEditable(pointContext(x, y).element)) return null;
  const sel = window.getSelection();
  if (!sel?.toString().trim() || sel.isCollapsed || !sel.rangeCount) return null;
  const text = sel.toString().trim();
  if (text.length < 2) return null;
  const range = sel.getRangeAt(0);
  for (const rect of range.getClientRects()) {
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return { text, range: range.cloneRange(), kind: 'selection' };
    }
  }
  return null;
}

function getSelectedText() {
  if (selectionInEditable()) return null;
  const sel = window.getSelection();
  if (!sel?.toString().trim() || sel.isCollapsed || !sel.rangeCount) return null;
  const text = sel.toString().trim();
  if (text.length < 2) return null;
  return { text, range: sel.getRangeAt(0).cloneRange(), kind: 'selection' };
}

function hoverTargetAt(x, y) {
  const selection = getSelectionHover(x, y);
  if (selection) return selection;
  const hit = findTextRangeAtPoint(x, y);
  return hit ? { text: hit.word, range: hit.range, kind: 'word' } : null;
}

function sameTarget(a, b) {
  return !!a && !!b && a.kind === b.kind && a.text === b.text &&
    a.range.startContainer === b.range.startContainer && a.range.startOffset === b.range.startOffset &&
    a.range.endContainer === b.range.endContainer && a.range.endOffset === b.range.endOffset;
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
  clearTimeout(moveTimer);
  moveTimer = 0;
  pendingRequest++;
  loading = false;
  popupText = '';
  activeTarget = null;
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

async function requestTranslate(target, cx, cy) {
  if (!settingsReady || !settings.enabled || loading) return;
  const { text, range } = target;
  const rect = range.getBoundingClientRect();
  const sl = settings.sourceLang;
  const tl = settings.targetLang;
  const req = ++pendingRequest;
  const isCurrent = () => {
    if (req !== pendingRequest) return false;
    const current = target.kind === 'selection' ? getSelectedText() :
      pointerInside ? hoverTargetAt(lastX, lastY) : null;
    if (!settings.enabled || settings.sourceLang !== sl || settings.targetLang !== tl ||
        !sameTarget(activeTarget, target) || !sameTarget(current, target) || !range.startContainer.isConnected) {
      hidePopupNow();
      if (pointerInside) processPointer();
      return false;
    }
    return true;
  };
  loading = true;
  showLoading(text, rect, cx, cy);
  try {
    const result = await runtimeSend({
      type: 'translate',
      text,
      tl,
      sl,
    });
    if (!isCurrent()) return;
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
      popupText = text;
    }
  } catch (e) {
    if (!isCurrent()) return;
    loading = false;
    const m = String(e?.message || '');
    const hint = m.includes('invalidated') || m.includes('Receiving end')
      ? 'Glossa neu laden: F5 auf dieser Seite'
      : 'Verbindung fehlgeschlagen';
    showError(text, hint, rect, cx, cy);
    popupText = text;
  }
}

function scheduleHover(target) {
  if (hoverTimer || loading || popupText === target.text) return;
  const delay = settings.hoverDelayMs ?? HOVER_MS;
  hoverTimer = setTimeout(() => {
    hoverTimer = 0;
    if (!settings.enabled || !settingsReady || !pointerInside) return;
    const current = hoverTargetAt(lastX, lastY);
    if (!sameTarget(current, target) || !sameTarget(activeTarget, target)) {
      // A throttled movement may not have updated activeTarget yet. Process it
      // instead of discarding its trailing timer and stranding the next word.
      processPointer();
      return;
    }
    requestTranslate(current, lastX, lastY);
  }, delay);
}

function onMouseMove(e) {
  if (!settings.enabled || !settingsReady) return;
  pointerInside = true;
  lastX = e.clientX;
  lastY = e.clientY;
  // Check the exposed composed event path as well as the retargeted event element.
  if ((e.composedPath?.() || [e.target]).some(isEditable)) {
    hidePopupNow();
    return;
  }
  const now = Date.now();
  const remaining = MOVE_THROTTLE_MS - (now - lastMoveAt);
  if (remaining > 0) {
    if (!moveTimer) moveTimer = setTimeout(processPointer, remaining);
    return;
  }
  clearTimeout(moveTimer);
  processPointer();
}

function processPointer() {
  moveTimer = 0;
  lastMoveAt = Date.now();
  if (!settings.enabled || !settingsReady || !pointerInside) return;
  const target = hoverTargetAt(lastX, lastY);
  if (!sameTarget(target, activeTarget)) {
    hidePopupNow();
    activeTarget = target;
  }
  if (target) scheduleHover(target);
}

function onMouseDown() {
  hidePopupNow();
}

function onSelectionFinish() {
  if (!settings.enabled || !settingsReady) return;
  if (selectionInEditable()) return;
  const sel = getSelectedText();
  if (!sel) return;
  hidePopupNow();
  activeTarget = sel;
  const rect = sel.range.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  requestTranslate(sel, cx, rect.bottom);
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
