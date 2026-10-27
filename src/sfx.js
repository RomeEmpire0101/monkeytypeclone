// Keyboard sounds from the Mechvibes NK Cream pack (MIT, see assets/sfx/nk-cream/).
// config.json maps each keycode to a per-key .wav file.
const BASE = "assets/sfx/nk-cream/";
const KEY_BACKSPACE = "14";
const KEY_SPACE = "57";

let ctx = null;
let codes = {};
let files = [];
const decoded = new Map();
let loading = null;
let muted = localStorage.getItem("sfx-muted") === "1";

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

async function fetchBuffer(name) {
  if (!decoded.has(name)) {
    const bytes = await fetch(BASE + encodeURIComponent(name)).then((r) => r.arrayBuffer());
    decoded.set(name, await audio().decodeAudioData(bytes));
  }
  return decoded.get(name);
}

// Read config once and decode every referenced wav, on the first keypress.
function load() {
  if (loading) return loading;
  loading = fetch(BASE + "config.json")
    .then((r) => r.json())
    .then((config) => {
      codes = Object.fromEntries(
        Object.entries(config.defines).filter(([, f]) => typeof f === "string"),
      );
      files = [...new Set(Object.values(codes))];
      return Promise.all(files.map(fetchBuffer));
    })
    .then(() => true)
    .catch(() => false);
  return loading;
}

function playFile(name, { vol = 1, rate = 1 } = {}) {
  const buf = decoded.get(name);
  if (!buf) return;
  const a = audio();
  const src = a.createBufferSource();
  const g = a.createGain();
  src.buffer = buf;
  // Small pitch jitter so repeated keys don't sound identical.
  src.playbackRate.value = rate * (0.97 + Math.random() * 0.06);
  g.gain.value = vol;
  src.connect(g).connect(a.destination);
  src.start();
}

const randomFile = () => files[Math.floor(Math.random() * files.length)];
const byCode = (code) => codes[code] || randomFile();

const SOUNDS = {
  key: () => playFile(randomFile(), { vol: 0.9 }),
  back: () => playFile(byCode(KEY_BACKSPACE), { vol: 0.8 }),
  word: () => playFile(byCode(KEY_SPACE), { vol: 0.9 }),
  error: () => playFile(randomFile(), { vol: 0.5, rate: 0.85 }),
  finish: () => playFile(byCode(KEY_SPACE), { vol: 1, rate: 1.2 }),
};

export function play(name) {
  if (muted || !SOUNDS[name]) return;
  if (!decoded.size) {
    load().then((ok) => ok && play(name));
    return;
  }
  try {
    SOUNDS[name]();
  } catch {
    // Audio is optional; a failure here must never break typing.
  }
}

export function toggleMuted() {
  muted = !muted;
  localStorage.setItem("sfx-muted", muted ? "1" : "0");
  return muted;
}

export const isMuted = () => muted;
