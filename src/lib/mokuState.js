const KEY = "moku-state";

export const LEVEL_THRESHOLDS = [
  0, 50, 120, 220, 350, 520, 740, 1020, 1360, 1760,
  2260, 2860, 3560, 4360, 5260, 6260, 7360, 8560, 9860, 11260,
];

export function getLevel(xp) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 20);
}

export function getXpForNextLevel(xp) {
  const level = getLevel(xp);
  if (level >= 20) return { current: xp, needed: LEVEL_THRESHOLDS[19], pct: 100 };
  const base = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level];
  const current = xp - base;
  const needed = next - base;
  return { current, needed, pct: Math.round((current / needed) * 100) };
}

// "baby"(1-5), "teen"(6-10), "prince"(11-15), "legendary"(16-20)
export function getMokuStage(level) {
  if (level <= 5) return "baby";
  if (level <= 10) return "teen";
  if (level <= 15) return "prince";
  return "legendary";
}

export function getMokuColors(level) {
  const stage = getMokuStage(level);
  switch (stage) {
    case "baby":      return { c1: "#9b8df7", c2: "#7c6cf7", c3: "#5e40c8", glow: "#7c5ce7" };
    case "teen":      return { c1: "#5de6b8", c2: "#00bfa6", c3: "#00897b", glow: "#00bfa6" };
    case "prince":    return { c1: "#ff8a65", c2: "#f4511e", c3: "#bf360c", glow: "#f4511e" };
    case "legendary": return { c1: "#ffd54f", c2: "#ffb300", c3: "#ff6f00", glow: "#fbbf24" };
    default:          return { c1: "#9b8df7", c2: "#7c6cf7", c3: "#5e40c8", glow: "#7c5ce7" };
  }
}

export function loadMokuState() {
  if (typeof window === "undefined") return { xp: 0, sessionsCompleted: 0, totalMinutes: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { xp: 0, sessionsCompleted: 0, totalMinutes: 0 };
  } catch {
    return { xp: 0, sessionsCompleted: 0, totalMinutes: 0 };
  }
}

export function saveMokuState(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function addXp(amount, extraFields = {}) {
  const state = loadMokuState();
  const next = { ...state, xp: (state.xp || 0) + amount, ...extraFields };
  saveMokuState(next);
  return next;
}
