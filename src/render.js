import { CFG } from "./state.js";

const $ = (sel) => document.querySelector(sel);
const inner = $("#inner");
const status = $("#status");
const typing = $("#typing");
const results = $("#results");

// One caret that glides between letters, instead of boxing each letter.
const caret = document.createElement("div");
caret.className = "caret";

// Word elements persist between keystrokes; only words whose state changed are rebuilt.
let view = { s: null, els: [], idx: -1, row: -1 };

function buildWord(el, s, i) {
  const target = s.words[i];
  const active = i === s.idx;
  const typed = i < s.idx ? s.typed[i] : active ? s.input : "";
  const len = Math.max(target.length, typed.length + (active ? 1 : 0));
  const frag = document.createDocumentFragment();

  for (let j = 0; j < len; j++) {
    const c = document.createElement("span");
    let ch;
    let cls;

    if (j < target.length) {
      ch = target[j];
      if (j < typed.length) cls = typed[j] === ch ? "ok" : "bad";
      else cls = i < s.idx ? "miss" : "";
    } else {
      ch = j < typed.length ? typed[j] : " ";
      cls = "extra";
    }

    c.textContent = ch;
    c.className = cls;
    frag.appendChild(c);
  }

  el.className = "word" + (active ? " active" : "");
  el.replaceChildren(frag);
}

export function renderWords(s) {
  const fresh = view.s !== s;
  if (fresh) {
    // New test: drop old elements and reset scroll and caret without animating them back.
    inner.replaceChildren(caret);
    inner.style.transition = "none";
    caret.style.transition = "none";
    inner.style.transform = "";
    view = { s, els: [], idx: -1, row: -1 };
  }

  const dirty = new Set();
  for (let i = view.els.length; i < s.words.length; i++) {
    const el = document.createElement("div");
    view.els.push(el);
    inner.appendChild(el);
    dirty.add(i);
  }
  // Only the previously active word, the current one, and any newly added words change.
  for (let i = Math.max(0, view.idx); i <= s.idx && i < s.words.length; i++) dirty.add(i);
  dirty.forEach((i) => buildWord(view.els[i], s, i));
  view.idx = s.idx;

  placeCaret(s);
  scrollToActive(s);

  if (fresh) {
    void inner.offsetHeight;
    inner.style.transition = "";
    caret.style.transition = "";
  }
}

function placeCaret(s) {
  const word = view.els[s.idx];
  if (!word || !word.children.length) return;
  const spans = word.children;
  const i = s.input.length;
  const last = spans[spans.length - 1];
  const x = i < spans.length ? spans[i].offsetLeft : last.offsetLeft + last.offsetWidth;
  const lh = parseFloat(getComputedStyle(inner).lineHeight);
  const y = word.offsetTop + (lh - caret.offsetHeight) / 2;
  caret.style.transform = `translate(${x}px, ${y}px)`;
}

// Keeps the active word on the second row of a three-row window; moves only when the row changes.
function scrollToActive(s) {
  const cur = view.els[s.idx];
  if (!cur) return;
  const lh = parseFloat(getComputedStyle(inner).lineHeight);
  const row = Math.round(cur.offsetTop / lh);
  if (row === view.row) return;
  view.row = row;
  const shift = row >= 2 ? (row - 1) * lh : 0;
  inner.style.transform = `translateY(${-shift}px)`;
}

export function renderStatus(text) {
  status.textContent = text;
}

export function showTyping() {
  results.classList.add("hidden");
  typing.classList.remove("hidden");
}

export function showResults(stats) {
  $("#r-wpm").textContent = stats.wpm;
  $("#r-acc").textContent = stats.acc + "%";
  $("#r-raw").textContent = stats.raw;
  $("#r-chars").textContent = `${stats.correct}/${stats.wrong}`;
  $("#r-meta").textContent = `${CFG.mode} ${CFG.value}`;
  typing.classList.add("hidden");
  results.classList.remove("hidden");
  renderStatus("");
}

export function setActiveMode() {
  document.querySelectorAll("[data-mode]").forEach((b) => {
    const on = b.dataset.mode === CFG.mode && Number(b.dataset.value) === CFG.value;
    b.classList.toggle("active", on);
  });
}