# فرار از آزمایشگاه قفل‌شده

بازی «فرار از اتاق» فارسی و راست‌به‌چپ با React (فقط کامپوننت‌های کلاسی) و CSS Modules.
بدون سرور، بدون API و بدون اینترنت؛ رکوردها فقط در localStorage مرورگر ذخیره می‌شوند.

## راه‌اندازی
```bash
npm install
npm run dev        # اجرا در حالت توسعه (آدرس را در مرورگر باز کنید)
npm run build      # ساخت نسخه‌ی نهایی در پوشه‌ی dist
npm run preview    # اجرای نسخه‌ی ساخته‌شده
npm run test:logic # تست خودکار منطق معماها (بدون مرورگر)
```
نیازمند Node.js نسخه‌ی ۱۸ یا بالاتر. فقط هنگام `npm install` به اینترنت نیاز است؛ بعد از آن همه‌چیز آفلاین کار می‌کند.
پوشه‌ی `dist` را می‌توان روی هر لپ‌تاپ بدون اینترنت اجرا کرد (مثلاً `npm run preview`).

## ساختار
```
src/
  main.jsx, App.jsx, App.module.css
  components/  StartScreen, GameScreen, ResultScreen, Timer, Leaderboard, Lock (+ .module.css)
  game/        puzzles.js  utils.js  storage.js
scripts/test-puzzles.mjs
```
