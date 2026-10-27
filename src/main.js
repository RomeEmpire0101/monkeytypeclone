import { CFG } from "./state.js";
import { newTest, handleKey, isDone } from "./engine.js";
import { setActiveMode } from "./render.js";
import { toggleMuted, isMuted } from "./sfx.js";

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" || e.key === "Escape") {
    e.preventDefault();
    return newTest();
  }
  if (isDone() && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    return newTest();
  }
  handleKey(e);
});

document.querySelectorAll("[data-mode]").forEach((b) => {
  b.addEventListener("click", () => {
    CFG.mode = b.dataset.mode;
    CFG.value = Number(b.dataset.value);
    setActiveMode();
    newTest();
    b.blur();
  });
});

document.querySelector("#r-restart").addEventListener("click", newTest);

const sfxBtn = document.querySelector("#sfx-toggle");
const paintSfx = () => (sfxBtn.textContent = isMuted() ? "sound off" : "sound on");
sfxBtn.addEventListener("click", () => {
  toggleMuted();
  paintSfx();
  sfxBtn.blur();
});
paintSfx();

setActiveMode();
newTest();