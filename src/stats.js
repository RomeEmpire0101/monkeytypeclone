// Turns a finished session into the numbers shown on the results screen.
export function computeStats(s, seconds) {
  let correct = 0;
  let wrong = 0;

  const pairs = [
    ...s.typed.map((typed, i) => [typed, s.words[i]]),
    [s.input, s.words[s.idx]],
  ];

  for (const [typed, target] of pairs) {
    if (!typed || !target) continue;
    for (let j = 0; j < typed.length; j++) {
      if (j < target.length && typed[j] === target[j]) correct++;
      else wrong++;
    }
  }

  const minutes = Math.max(seconds, 1) / 60;
  return {
    wpm: Math.round(correct / 5 / minutes),
    raw: Math.round(s.keys / 5 / minutes),
    acc: s.keys ? Math.round(((s.keys - s.errors) / s.keys) * 100) : 100,
    correct,
    wrong,
  };
}