// تولیدکننده‌های معما و ساخت راند.
//
// هر نوع معما یک شیء است با: { id, title, icon, generate() }
// و generate() هر بار با داده‌ی تصادفی این ساختار را می‌سازد:
//   {
//     question,      // متن سؤال
//     visual,        // نمایش اختیاری: cells | grid | text | list
//     answer,        // پاسخ صحیح (number یا string)
//     answerType,    // 'number' یا 'text'
//     accepted,      // پاسخ‌های پذیرفته‌شده (فقط برای نوع text)
//     hint,          // راهنما
//   }

import {
  rand,
  pick,
  shuffle,
  toFa,
  formatNumber,
  normalizeAnswer,
  parseNumeric,
} from './utils.js';

export const ROUND_SIZE = 5;
export const HINT_PENALTY_SECONDS = 30;

const UNKNOWN = '؟';

/* ------------------------------------------------------------------ */
/* ۱) مجموع و تفاضل                                                    */
/* ------------------------------------------------------------------ */

function genSumDiff() {
  const b = rand(5, 60);
  const a = b + rand(2, 50);
  const sum = a + b;
  const diff = a - b;
  const askBig = Math.random() < 0.5;
  return {
    question:
      `روی ترازوی قدیمی آزمایشگاه دو وزنه قرار دارد. مجموع جرم آن‌ها ${toFa(sum)} گرم ` +
      `و اختلاف جرم‌شان ${toFa(diff)} گرم است. ` +
      `جرم ${askBig ? 'وزنه‌ی سنگین‌تر' : 'وزنه‌ی سبک‌تر'} چند گرم است؟`,
    answer: askBig ? a : b,
    answerType: 'number',
    hint: askBig
      ? 'اگر مجموع و تفاضل را با هم جمع کنی، دو برابر عدد بزرگ‌تر به دست می‌آید.'
      : 'اگر تفاضل را از مجموع کم کنی، دو برابر عدد کوچک‌تر به دست می‌آید.',
  };
}

/* ------------------------------------------------------------------ */
/* ۲) الگوی عددی (حسابی، هندسی، مربعی)                                 */
/* ------------------------------------------------------------------ */

function genPattern() {
  const kind = pick(['arith', 'geo', 'square']);
  const question =
    'روی دیوار آزمایشگاه دنباله‌ای از عددها نوشته شده، اما آخرین عدد پاک شده است. عدد بعدی کدام است؟';

  if (kind === 'arith') {
    const down = Math.random() < 0.3;
    const start = down ? rand(50, 99) : rand(2, 30);
    const d = down ? -rand(2, 7) : rand(2, 9);
    const terms = Array.from({ length: 5 }, (_, i) => start + d * i);
    return {
      question,
      visual: { kind: 'cells', items: [...terms.map(toFa), UNKNOWN] },
      answer: start + d * 5,
      answerType: 'number',
      hint: down
        ? 'اختلاف هر دو عدد کنار هم همیشه ثابت است؛ این بار عددها کم می‌شوند.'
        : 'اختلاف هر دو عدد کنار هم همیشه ثابت است. آن اختلاف را پیدا کن.',
    };
  }

  if (kind === 'geo') {
    const start = rand(1, 5);
    const r = rand(2, 4);
    const terms = Array.from({ length: 4 }, (_, i) => start * r ** i);
    return {
      question,
      visual: { kind: 'cells', items: [...terms.map(toFa), UNKNOWN] },
      answer: start * r ** 4,
      answerType: 'number',
      hint: 'هر عدد از ضرب عدد قبلی در یک عدد ثابت به دست می‌آید.',
    };
  }

  const n = rand(2, 9);
  const off = Math.random() < 0.5 ? 0 : pick([-3, -2, -1, 1, 2, 3, 4, 5]);
  const terms = Array.from({ length: 4 }, (_, i) => (n + i) ** 2 + off);
  return {
    question,
    visual: { kind: 'cells', items: [...terms.map(toFa), UNKNOWN] },
    answer: (n + 4) ** 2 + off,
    answerType: 'number',
    hint:
      off === 0
        ? 'هر عدد مربع یک عدد طبیعی است. ببین ریشه‌ی عددها چه ترتیبی دارند.'
        : 'عددها به مربع‌های کامل نزدیک‌اند. ابتدا مربع اعداد متوالی را بنویس، بعد ببین چه عدد ثابتی اضافه یا کم شده است.',
  };
}

/* ------------------------------------------------------------------ */
/* ۳) رمزگشایی سزار                                                    */
/* ------------------------------------------------------------------ */

const CAESAR_WORDS = [
  'ATOM', 'LASER', 'OXYGEN', 'NEURON', 'PLASMA', 'MAGNET', 'PHOTON', 'ROBOT',
  'CIRCUIT', 'ENERGY', 'SCIENCE', 'FORMULA', 'BEAKER', 'CRYSTAL', 'GENE', 'VOLTAGE',
];

function caesarEncode(word, shift) {
  return Array.from(word)
    .map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65))
    .join('');
}

function genCaesar() {
  const word = pick(CAESAR_WORDS);
  const shift = rand(1, 10);
  return {
    question:
      `پیام زیر با «رمز سزار» و جابه‌جایی ${toFa(shift)} حرف به جلو در الفبای انگلیسی رمز شده است ` +
      `(مثلاً با جابه‌جایی ۱، حرف A به B تبدیل می‌شود). پیام اصلی را به انگلیسی بنویس.`,
    visual: { kind: 'text', text: caesarEncode(word, shift), dir: 'ltr' },
    answer: word,
    answerType: 'text',
    accepted: [word],
    hint: `هر حرف را ${toFa(shift)} جایگاه به عقب ببر. حرف اول پیام اصلی «${word[0]}» است.`,
  };
}

/* ------------------------------------------------------------------ */
/* ۴) قفل ۴ رقمی با سرنخ‌های منطقی (جواب یکتا)                          */
/* ------------------------------------------------------------------ */

const ORD = ['اول', 'دوم', 'سوم', 'چهارم'];
const PRIMES = [2, 3, 5, 7];
let ALL_CODES = null;

/** همه‌ی رمزهای ممکن: ۴ رقم متفاوت و رقم اول غیرصفر */
function getAllCodes() {
  if (ALL_CODES) return ALL_CODES;
  const out = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 0; b <= 9; b++) {
      if (b === a) continue;
      for (let c = 0; c <= 9; c++) {
        if (c === a || c === b) continue;
        for (let d = 0; d <= 9; d++) {
          if (d === a || d === b || d === c) continue;
          out.push([a, b, c, d]);
        }
      }
    }
  }
  ALL_CODES = out;
  return out;
}

function randomSecret() {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  let code = shuffle(digits).slice(0, 4);
  while (code[0] === 0) code = shuffle(digits).slice(0, 4);
  return code;
}

/** استخر سرنخ‌هایی که همگی برای رمز واقعی درست‌اند */
function buildCluePool(s) {
  const pool = [];
  const sum = s[0] + s[1] + s[2] + s[3];
  pool.push({
    text: `مجموع چهار رقم برابر ${toFa(sum)} است.`,
    test: (c) => c[0] + c[1] + c[2] + c[3] === sum,
  });

  for (let i = 0; i < 4; i++) {
    const d = s[i];
    const even = d % 2 === 0;
    pool.push({
      text: `رقم ${ORD[i]} ${even ? 'زوج' : 'فرد'} است.`,
      test: (c) => (c[i] % 2 === 0) === even,
    });
    if (d > 0) {
      const t = rand(0, d - 1);
      pool.push({
        text: `رقم ${ORD[i]} از ${toFa(t)} بزرگ‌تر است.`,
        test: (c) => c[i] > t,
      });
    }
    if (d < 9) {
      const t = rand(d + 1, 9);
      pool.push({
        text: `رقم ${ORD[i]} از ${toFa(t)} کوچک‌تر است.`,
        test: (c) => c[i] < t,
      });
    }
    if (d > 0 && d % 3 === 0) {
      pool.push({
        text: `رقم ${ORD[i]} مضرب ۳ است.`,
        test: (c) => c[i] > 0 && c[i] % 3 === 0,
      });
    }
    if (PRIMES.includes(d)) {
      pool.push({
        text: `رقم ${ORD[i]} عددی اول است.`,
        test: (c) => PRIMES.includes(c[i]),
      });
    }
    for (let j = 0; j < 4; j++) {
      if (j === i) continue;
      const e = s[j];
      if (j > i) {
        pool.push({
          text: `مجموع رقم ${ORD[i]} و رقم ${ORD[j]} برابر ${toFa(d + e)} است.`,
          test: (c) => c[i] + c[j] === d + e,
        });
      }
      if (d > e) {
        pool.push({
          text: `رقم ${ORD[i]} از رقم ${ORD[j]} بزرگ‌تر است.`,
          test: (c) => c[i] > c[j],
        });
        const k = d - e;
        if (k <= 4) {
          pool.push({
            text: `رقم ${ORD[i]} دقیقاً ${toFa(k)} واحد از رقم ${ORD[j]} بیشتر است.`,
            test: (c) => c[i] - c[j] === k,
          });
        }
      }
    }
  }
  return pool;
}

function directClue(s, i) {
  return {
    text: `رقم ${ORD[i]} برابر ${toFa(s[i])} است.`,
    test: (c) => c[i] === s[i],
  };
}

function matchesOf(clues) {
  return getAllCodes().filter((c) => clues.every((cl) => cl.test(c)));
}

/** انتخاب سرنخ‌ها تا جواب یکتا شود، سپس حذف سرنخ‌های زائد */
function pickClues(secret) {
  let candidates = getAllCodes();
  const chosen = [];
  let remaining = shuffle(buildCluePool(secret));

  while (candidates.length > 1 && remaining.length > 0) {
    let best = null;
    let bestNext = null;
    for (const clue of remaining.slice(0, 8)) {
      const next = candidates.filter(clue.test);
      if (!bestNext || next.length < bestNext.length) {
        best = clue;
        bestNext = next;
      }
    }
    remaining = remaining.filter((c) => c !== best);
    if (bestNext.length < candidates.length) {
      chosen.push(best);
      candidates = bestNext;
    }
  }

  // اگر هنوز یکتا نشده بود، سرنخ مستقیم اضافه می‌کنیم (همیشه به جواب یکتا می‌رسد)
  if (candidates.length > 1) {
    for (const i of shuffle([0, 1, 2, 3])) {
      if (candidates.length === 1) break;
      const clue = directClue(secret, i);
      const next = candidates.filter(clue.test);
      if (next.length < candidates.length) {
        chosen.push(clue);
        candidates = next;
      }
    }
  }

  let pruned = chosen.slice();
  for (let k = pruned.length - 1; k >= 0; k--) {
    const trial = pruned.filter((_, idx) => idx !== k);
    if (matchesOf(trial).length === 1) pruned = trial;
  }
  return pruned;
}

function genLock() {
  let secret = null;
  let clues = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    secret = randomSecret();
    clues = pickClues(secret);
    if (clues.length >= 3 && clues.length <= 5) break;
  }
  const code = secret.join('');
  const matches = matchesOf(clues);
  const hintPos = rand(0, 3);
  return {
    question:
      'گاوصندوق آزمایشگاه یک رمز ۴ رقمی دارد. ارقام رمز همگی با هم متفاوت‌اند و رقم اول صفر نیست. ' +
      'با سرنخ‌های زیر رمز را پیدا کن:',
    visual: { kind: 'list', items: shuffle(clues).map((c) => c.text) },
    answer: code,
    answerType: 'text',
    accepted: [code],
    hint: `کمک: رقم ${ORD[hintPos]} برابر ${toFa(secret[hintPos])} است.`,
    // فقط برای تست: تعداد رمزهای سازگار با سرنخ‌ها (باید ۱ باشد)
    meta: {
      solutions: matches.length,
      consistent: matches.length === 1 && matches[0].join('') === code,
    },
  };
}

/* ------------------------------------------------------------------ */
/* ۵) فیزیک ساده: جابه‌جایی = سرعت × زمان                               */
/* ------------------------------------------------------------------ */

function genPhysics() {
  const variant = pick(['distance', 'time', 'speed', 'car']);

  if (variant === 'distance') {
    const v = rand(2, 25);
    const t = rand(3, 30);
    return {
      question: `یک ربات آزمایشگاهی روی ریل با سرعت ثابت ${toFa(v)} متر بر ثانیه حرکت می‌کند. در ${toFa(t)} ثانیه چند متر جابه‌جا می‌شود؟`,
      answer: v * t,
      answerType: 'number',
      hint: 'جابه‌جایی = سرعت × زمان',
    };
  }
  if (variant === 'time') {
    const v = rand(2, 25);
    const t = rand(3, 30);
    return {
      question: `ربات با سرعت ثابت ${toFa(v)} متر بر ثانیه حرکت می‌کند و باید ${toFa(v * t)} متر از ریل را طی کند. این کار چند ثانیه طول می‌کشد؟`,
      answer: t,
      answerType: 'number',
      hint: 'زمان = جابه‌جایی ÷ سرعت',
    };
  }
  if (variant === 'speed') {
    const v = rand(2, 25);
    const t = rand(3, 30);
    return {
      question: `یک گوی فلزی در ${toFa(t)} ثانیه با سرعت ثابت ${toFa(v * t)} متر روی ناودان حرکت کرد. سرعتش چند متر بر ثانیه بود؟`,
      answer: v,
      answerType: 'number',
      hint: 'سرعت = جابه‌جایی ÷ زمان',
    };
  }
  const v = rand(3, 12) * 10;
  const t = rand(2, 6);
  return {
    question: `یک خودروی آزمایشگاهی با سرعت ثابت ${toFa(v)} کیلومتر بر ساعت به‌مدت ${toFa(t)} ساعت حرکت می‌کند. چند کیلومتر جابه‌جا می‌شود؟`,
    answer: v * t,
    answerType: 'number',
    hint: 'جابه‌جایی = سرعت × زمان (یکای سرعت کیلومتر بر ساعت و زمان بر حسب ساعت است).',
  };
}

/* ------------------------------------------------------------------ */
/* ۶) درصد و تخفیف                                                     */
/* ------------------------------------------------------------------ */

const SHOP_ITEMS = [
  'کیت آزمایشگاهی',
  'میکروسکوپ کوچک',
  'جعبه‌ی لوله‌های آزمایش',
  'ترازوی دیجیتال',
  'مجموعه‌ی مواد شیمیایی آموزشی',
];

function genPercent() {
  const variant = pick(['final', 'discount', 'original']);
  const p = pick([10, 15, 20, 25, 30, 40, 50]);
  const price = rand(4, 60) * 1000; // مضرب هزار ⇒ درصد همیشه عدد صحیح می‌شود
  const off = (price * p) / 100;
  const final = price - off;
  const item = pick(SHOP_ITEMS);
  const pc = `${toFa(p)}٪`;

  if (variant === 'final') {
    return {
      question: `قیمت ${item} ${formatNumber(price)} تومان است و ${pc} تخفیف دارد. قیمت نهایی چند تومان می‌شود؟`,
      answer: final,
      answerType: 'number',
      hint: 'ابتدا مقدار تخفیف را حساب کن (قیمت × درصد ÷ ۱۰۰) و بعد از قیمت اصلی کم کن.',
    };
  }
  if (variant === 'discount') {
    return {
      question: `قیمت ${item} ${formatNumber(price)} تومان است. با ${pc} تخفیف، چند تومان از قیمت کم می‌شود؟`,
      answer: off,
      answerType: 'number',
      hint: 'مقدار تخفیف = قیمت × درصد ÷ ۱۰۰',
    };
  }
  return {
    question: `${item} با ${pc} تخفیف به قیمت ${formatNumber(final)} تومان فروخته شد. قیمت اصلی (قبل از تخفیف) چند تومان بوده است؟`,
    answer: price,
    answerType: 'number',
    hint: `قیمت نهایی معادل ${toFa(100 - p)}٪ قیمت اصلی است. قیمت نهایی را بر ${toFa(100 - p)} تقسیم کن و در ۱۰۰ ضرب کن.`,
  };
}

/* ------------------------------------------------------------------ */
/* ۷) معمای کلمه (حروف درهم‌ریخته)                                      */
/* ------------------------------------------------------------------ */

const FA_WORDS = [
  'دانشمند', 'آزمایش', 'فرمول', 'انرژی', 'مغناطیس', 'میکروسکوپ',
  'جاذبه', 'سیاره', 'واکنش', 'الکترون', 'کهکشان', 'ترازو', 'پژوهش', 'اختراع',
];
const EN_WORDS = [
  'MICROSCOPE', 'ELECTRON', 'GRAVITY', 'MOLECULE', 'PLANET', 'ENERGY',
  'SCIENCE', 'EXPERIMENT', 'CRYSTAL', 'MAGNET', 'GALAXY', 'OXYGEN',
];

function genScramble() {
  const persian = Math.random() < 0.5;
  const word = persian ? pick(FA_WORDS) : pick(EN_WORDS);
  const letters = Array.from(word);
  let mixed = letters;
  for (let i = 0; i < 50; i++) {
    mixed = shuffle(letters);
    if (mixed.join('') !== word) break;
  }
  const first = Array.from(word)[0];
  return {
    question: persian
      ? 'حروف زیر یک کلمه‌ی فارسی مرتبط با علم هستند که درهم‌ریخته شده است. کلمه را پیدا کن.'
      : 'حروف زیر یک کلمه‌ی انگلیسی مرتبط با علم هستند که درهم‌ریخته شده است. کلمه را به انگلیسی بنویس.',
    visual: { kind: 'text', text: mixed.join(' · '), dir: persian ? 'rtl' : 'ltr' },
    answer: word,
    answerType: 'text',
    accepted: [word],
    hint: `کلمه با «${first}» شروع می‌شود و ${toFa(letters.length)} حرف دارد.`,
  };
}

/* ------------------------------------------------------------------ */
/* ۸) نوع دلخواه: تبدیل دودویی (باینری) ↔ ده‌دهی                        */
/* ------------------------------------------------------------------ */

function genBinary() {
  if (Math.random() < 0.5) {
    const n = rand(5, 63);
    return {
      question: 'رایانه‌ی خاموش آزمایشگاه یک عدد دودویی (باینری) نمایش می‌دهد. معادل ده‌دهی آن چیست؟',
      visual: { kind: 'text', text: n.toString(2), dir: 'ltr' },
      answer: n,
      answerType: 'number',
      hint: 'ارزش مکانی رقم‌ها از راست به چپ ۱، ۲، ۴، ۸، ۱۶، ۳۲ است. ارزش مکان‌هایی را که رقم ۱ دارند جمع کن.',
    };
  }
  const n = rand(5, 40);
  const bin = n.toString(2);
  return {
    question: `رایانه‌ی آزمایشگاه فقط عدد دودویی (صفر و یک) می‌فهمد. عدد ${toFa(n)} را به دودویی تبدیل کن و فقط صفرها و یک‌ها را بنویس.`,
    answer: bin,
    answerType: 'text',
    accepted: [bin, bin.padStart(6, '0'), bin.padStart(8, '0')],
    hint: 'عدد را مرتب بر ۲ تقسیم کن و باقی‌مانده‌ها را از آخر به اول کنار هم بنویس.',
  };
}

/* ------------------------------------------------------------------ */
/* ۹) نوع دلخواه: جدول جادویی ۳×۳                                       */
/* ------------------------------------------------------------------ */

const LOSHU = [
  [8, 1, 6],
  [3, 5, 7],
  [4, 9, 2],
];

function transformSquare(m) {
  let g = m.map((r) => r.slice());
  const rotations = rand(0, 3);
  for (let i = 0; i < rotations; i++) {
    g = g[0].map((_, c) => g.map((row) => row[c]).reverse());
  }
  if (Math.random() < 0.5) g = g.map((r) => r.slice().reverse());
  return g;
}

function genMagic() {
  const mul = rand(1, 3);
  const add = rand(0, 10);
  const grid = transformSquare(LOSHU).map((row) => row.map((v) => v * mul + add));
  const r = rand(0, 2);
  const c = rand(0, 2);
  const hidden = grid[r][c];
  const rows = grid.map((row, ri) =>
    row.map((v, ci) => (ri === r && ci === c ? UNKNOWN : toFa(v)))
  );
  return {
    question:
      'روی در مخفی، یک جدول جادویی نقش بسته است: مجموع اعداد هر سطر، هر ستون و هر دو قطر با هم برابر است. عدد گم‌شده کدام است؟',
    visual: { kind: 'grid', rows },
    answer: hidden,
    answerType: 'number',
    hint: 'مجموع یکی از سطرهای کامل را حساب کن؛ سطر ناقص هم باید همان مجموع را داشته باشد.',
  };
}

/* ------------------------------------------------------------------ */
/* استخر معماها و ساخت راند                                             */
/* ------------------------------------------------------------------ */

export const PUZZLE_TYPES = [
  { id: 'sumdiff', title: 'ترازوی قدیمی', icon: '⚖️', generate: genSumDiff },
  { id: 'pattern', title: 'دنباله‌ی روی دیوار', icon: '🔢', generate: genPattern },
  { id: 'caesar', title: 'پیام رمزی دانشمند', icon: '📜', generate: genCaesar },
  { id: 'lock', title: 'گاوصندوق', icon: '🗝️', generate: genLock },
  { id: 'physics', title: 'ریل آزمایشگاهی', icon: '🚀', generate: genPhysics },
  { id: 'percent', title: 'قفسه‌ی تجهیزات', icon: '🧪', generate: genPercent },
  { id: 'scramble', title: 'حروف پراکنده', icon: '🔤', generate: genScramble },
  { id: 'binary', title: 'رایانه‌ی خاموش', icon: '💻', generate: genBinary },
  { id: 'magic', title: 'جدول جادویی', icon: '🔳', generate: genMagic },
];

function makeKey(typeId, data) {
  return `${typeId}|${data.question}|${JSON.stringify(data.visual || null)}`;
}

/**
 * ساخت یک راند: ۵ معمای متفاوت (بدون تکرار نوع) از استخر.
 * previousKeys: کلید سؤال‌های راند قبلی؛ هیچ‌کدام در راند جدید تکرار نمی‌شوند.
 */
export function buildRound(previousKeys = []) {
  const prev = new Set(previousKeys);
  return shuffle(PUZZLE_TYPES)
    .slice(0, ROUND_SIZE)
    .map((type, index) => {
      let data = null;
      for (let i = 0; i < 40; i++) {
        data = type.generate();
        if (!prev.has(makeKey(type.id, data))) break;
      }
      return {
        id: `${type.id}-${index}`,
        typeId: type.id,
        title: type.title,
        icon: type.icon,
        key: makeKey(type.id, data),
        ...data,
      };
    });
}

/** بررسی پاسخ کاربر (ورودی نرمال‌سازی می‌شود) */
export function checkAnswer(puzzle, input) {
  if (puzzle.answerType === 'number') {
    const n = parseNumeric(input);
    return n !== null && n === puzzle.answer;
  }
  const given = normalizeAnswer(input);
  if (!given) return false;
  return puzzle.accepted.some((a) => normalizeAnswer(a) === given);
}
