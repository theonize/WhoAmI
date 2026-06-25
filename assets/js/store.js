// Tiny persistence layer over localStorage. All keys are namespaced.
// Everything degrades gracefully if storage is unavailable (e.g. private mode).
const NS = "whoami:v1:";
const KEYS = {
  theme: NS + "theme",
  progress: NS + "progress", // JSON array of completed chapter ids
  notes: NS + "notes"        // JSON object { questionId: text }
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ---- Theme ---------------------------------------------------------------- */
export function getTheme() {
  // "light" | "dark" | null (null = follow system preference)
  return read(KEYS.theme, null);
}
export function setTheme(theme) {
  if (theme === null) {
    try { localStorage.removeItem(KEYS.theme); } catch {}
  } else {
    write(KEYS.theme, theme);
  }
}

/* ---- Reading progress ----------------------------------------------------- */
export function getProgress() {
  const arr = read(KEYS.progress, []);
  return Array.isArray(arr) ? arr : [];
}
export function isComplete(chapterId) {
  return getProgress().includes(chapterId);
}
export function setComplete(chapterId, complete) {
  const set = new Set(getProgress());
  if (complete) set.add(chapterId);
  else set.delete(chapterId);
  write(KEYS.progress, [...set]);
  return [...set];
}

/* ---- Reflection notes ----------------------------------------------------- */
export function getNote(questionId) {
  const notes = read(KEYS.notes, {});
  return (notes && notes[questionId]) || "";
}
export function setNote(questionId, text) {
  const notes = read(KEYS.notes, {}) || {};
  if (text && text.trim()) notes[questionId] = text;
  else delete notes[questionId];
  write(KEYS.notes, notes);
}
export function getAllNotes() {
  return read(KEYS.notes, {}) || {};
}
