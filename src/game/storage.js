// خواندن/نوشتن localStorage با تحمل خطا.
// اگر localStorage در دسترس نباشد (مثلاً حالت خصوصی)، از حافظه‌ی موقت استفاده می‌شود.

const LEADERBOARD_KEY = 'escapeLab.leaderboard.v1';
const LAST_ROUND_KEY = 'escapeLab.lastRound.v1';
const MAX_STORED = 50;

const memory = {};

function read(key) {
  try {
    const v = globalThis.localStorage.getItem(key);
    return v === undefined ? null : v;
  } catch (e) {
    return memory[key] === undefined ? null : memory[key];
  }
}

function write(key, value) {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch (e) {
    memory[key] = value;
  }
}

function remove(key) {
  try {
    globalThis.localStorage.removeItem(key);
  } catch (e) {
    delete memory[key];
  }
}

function sortEntries(list) {
  return list.slice().sort(
    (a, b) => a.totalMs - b.totalMs || a.hints - b.hints || a.date - b.date
  );
}

function isValidEntry(e) {
  return (
    e &&
    typeof e === 'object' &&
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    Number.isFinite(e.totalMs) &&
    Number.isFinite(e.hints) &&
    Number.isFinite(e.date)
  );
}

/** همه‌ی رکوردها، مرتب‌شده از سریع‌ترین */
export function getLeaderboard() {
  const raw = read(LEADERBOARD_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortEntries(parsed.filter(isValidEntry));
  } catch (e) {
    return [];
  }
}

/** ثبت رکورد جدید؛ رکورد ساخته‌شده را برمی‌گرداند */
export function addScore({ name, totalMs, hints }) {
  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(name || 'ناشناس').slice(0, 20),
    totalMs: Math.round(totalMs),
    hints,
    date: Date.now(),
  };
  const next = sortEntries([...getLeaderboard(), entry]).slice(0, MAX_STORED);
  write(LEADERBOARD_KEY, JSON.stringify(next));
  return entry;
}

/** پاک‌کردن کل جدول (برای مدیر نمایشگاه) */
export function clearLeaderboard() {
  remove(LEADERBOARD_KEY);
}

/** کلید سؤال‌های راند قبلی؛ برای اینکه راند بعدی سؤال تکراری نداشته باشد */
export function getLastRoundKeys() {
  const raw = read(LAST_ROUND_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : [];
  } catch (e) {
    return [];
  }
}

export function saveLastRoundKeys(keys) {
  write(LAST_ROUND_KEY, JSON.stringify(keys));
}
