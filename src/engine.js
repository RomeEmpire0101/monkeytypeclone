import { CFG, live } from "./state.js";
import { makeWords } from "./words.js";
import { renderWords, renderStatus, showResults, showTyping } from "./render.js";
import { computeStats } from "./stats.js";
import { play } from "./sfx.js";

const MAX_INPUT = 40;
const secondsSince = (s) => (Date.now() - s.start) / 1000;

export function newTest() {
  clearInterval(live.timer);
  const count = CFG.mode === "words" ? CFG.value : 100;
  live.s = {
    words: makeWords(count),
    idx: 0,
    input: "",
    typed: [],
    started: false,
    done: false,
    start: 0,
    keys: 0,
    errors: 0,
  };
  showTyping();
  refresh();
}

export function isDone() {
  return !!live.s?.done;
}

function refresh() {
  renderWords(live.s);
  tick();
}

function tick() {
  const s = live.s;
  if (s.done) return;
  if (CFG.mode === "words") return renderStatus(`${s.idx}/${CFG.value}`);
  if (!s.started) return renderStatus(String(CFG.value));

  const remaining = Math.max(0, CFG.value - secondsSince(s));
  renderStatus(String(Math.ceil(remaining)));
  if (remaining <= 0) finish();
}

function start() {
  const s = live.s;
  s.started = true;
  s.start = Date.now();
  if (CFG.mode === "time") live.timer = setInterval(tick, 200);
}

function finish() {
  const s = live.s;
  if (s.done) return;
  s.done = true;
  clearInterval(live.timer);
  play("finish");
  const seconds = CFG.mode === "time" ? CFG.value : secondsSince(s);
  showResults(computeStats(s, seconds));
}

export function handleKey(e) {
  const s = live.s;
  if (s.done || e.metaKey) return;

  if (e.ctrlKey || e.altKey) {
    if (e.key === "Backspace") {
      e.preventDefault();
      s.input = "";
      refresh();
    }
    return;
  }

  if (e.key === "Backspace") {
    e.preventDefault();
    s.input = s.input.slice(0, -1);
    play("back");
  } else if (e.key === " ") {
    e.preventDefault();
    if (!s.input) return;
    s.typed[s.idx] = s.input;
    s.input = "";
    s.idx++;
    play("word");
    if (CFG.mode === "words" && s.idx >= s.words.length) return finish();
    if (CFG.mode === "time" && s.idx + 20 > s.words.length) {
      s.words.push(...makeWords(50));
    }
  } else if (e.key.length === 1) {
    e.preventDefault();
    if (s.input.length >= MAX_INPUT) return;
    if (!s.started) start();

    const target = s.words[s.idx];
    s.keys++;
    const hit = s.input.length < target.length && e.key === target[s.input.length];
    if (!hit) s.errors++;
    play(hit ? "key" : "error");
    s.input += e.key;

    // In words mode the test ends as soon as the last word is typed correctly.
    if (CFG.mode === "words" && s.idx === s.words.length - 1 && s.input === target) {
      s.typed[s.idx] = s.input;
      s.idx++;
      return finish();
    }
  } else {
    return;
  }

  refresh();
}