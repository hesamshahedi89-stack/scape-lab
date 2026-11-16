// ابزارهای عمومی بازی: عدد تصادفی، آمیختن، تبدیل ارقام، نرمال‌سازی ورودی

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** عدد صحیح تصادفی در بازه‌ی بسته‌ی [min, max] */
export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** یک عضو تصادفی از آرایه */
export function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

/** آمیختن فیشر-یتس؛ آرایه‌ی اصلی تغییر نمی‌کند */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ارقام انگلیسی → فارسی (برای نمایش) */
export function toFa(value) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** عدد با جداکننده‌ی هزارگان و ارقام فارسی، مثلاً ۲۵۰٬۰۰۰ */
export function formatNumber(n) {
  return toFa(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
}

/** ارقام فارسی و عربی → انگلیسی */
export function toEnglishDigits(str) {
  return String(str)
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660));
}

/**
 * نرمال‌سازی پاسخ کاربر:
 * trim، تبدیل ارقام فارسی/عربی به انگلیسی، یکسان‌سازی حروف بزرگ/کوچک،
 * حذف نیم‌فاصله و نویسه‌های نامرئی، یکسان‌سازی «ی/ک/ه/ا» عربی و فارسی.
 */
export function normalizeAnswer(value) {
  return toEnglishDigits(String(value ?? ''))
    .replace(/[​-‏‪-‮⁦-⁩﻿]/g, '')
    .replace(/ـ/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[آأإ]/g, 'ا')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** تبدیل ورودی عددی کاربر به number؛ اگر عدد معتبر نبود null */
export function parseNumeric(value) {
  const s = normalizeAnswer(value)
    .replace(/[,٬،\s]/g, '')
    .replace(/٫/g, '.')
    .replace(/[−–]/g, '-');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** میلی‌ثانیه → «mm:ss» (انگلیسی؛ برای نمایش با toFa تبدیل شود) */
export function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
