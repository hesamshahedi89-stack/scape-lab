// تست منطق بازی بدون مرورگر:  npm run test:logic
import assert from 'node:assert/strict';

// localStorage ساختگی، قبل از import کردن storage
const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

const { buildRound, checkAnswer, PUZZLE_TYPES, ROUND_SIZE } = await import('../src/game/puzzles.js');
const { normalizeAnswer, parseNumeric, toFa, formatTime } = await import('../src/game/utils.js');
const storage = await import('../src/game/storage.js');

let passed = 0;
const ok = (name) => { passed++; console.log('✔', name); };

// ۱) حداقل ۸ نوع معما
assert.ok(PUZZLE_TYPES.length >= 8);
ok(`استخر دارای ${PUZZLE_TYPES.length} نوع معماست`);

// ۲) هر راند ۵ معمای متفاوت، جواب درست پذیرفته و جواب غلط رد می‌شود
const typeCount = {};
for (let i = 0; i < 1500; i++) {
  const round = buildRound();
  assert.equal(round.length, ROUND_SIZE);
  assert.equal(new Set(round.map((p) => p.typeId)).size, ROUND_SIZE);
  for (const p of round) {
    typeCount[p.typeId] = (typeCount[p.typeId] || 0) + 1;
    assert.ok(p.question && p.hint, `${p.typeId}: سؤال/راهنما خالی است`);
    assert.ok(checkAnswer(p, String(p.answer)), `${p.typeId}: جواب درست رد شد`);
    assert.ok(checkAnswer(p, `  ${toFa(p.answer)}  `), `${p.typeId}: ارقام فارسی`);
    if (p.answerType === 'number') {
      assert.ok(Number.isInteger(p.answer), `${p.typeId}: جواب صحیح نیست`);
      assert.ok(!checkAnswer(p, String(p.answer + 1)), `${p.typeId}: جواب غلط پذیرفته شد`);
      assert.ok(!checkAnswer(p, 'abc'));
    } else {
      assert.ok(checkAnswer(p, String(p.answer).toLowerCase()), `${p.typeId}: حروف کوچک`);
      assert.ok(!checkAnswer(p, p.answer + 'x'));
    }
    assert.ok(!checkAnswer(p, ''));
    if (p.typeId === 'lock') {
      assert.equal(p.meta.solutions, 1, 'قفل: جواب یکتا نیست');
      assert.ok(p.meta.consistent, 'قفل: سرنخ‌ها با رمز ناسازگارند');
      assert.ok(p.visual.items.length >= 1 && p.visual.items.length <= 8);
    }
  }
}
ok('۱۵۰۰ راند: ۵ نوع متفاوت، جواب‌ها درست، قفل همیشه یکتا');
assert.equal(Object.keys(typeCount).length, PUZZLE_TYPES.length);
ok('همه‌ی ۹ نوع معما در راندها ظاهر می‌شوند');

// ۳) دو راند پشت‌سرهم هیچ سؤال یکسانی ندارند
for (let i = 0; i < 800; i++) {
  const a = buildRound();
  const b = buildRound(a.map((p) => p.key));
  const ka = new Set(a.map((p) => p.key));
  for (const p of b) assert.ok(!ka.has(p.key), `سؤال تکراری: ${p.typeId}`);
}
ok('۸۰۰ جفت راند پشت‌سرهم: هیچ سؤال مشترکی نیست');

// ۴) تنوع: سؤال‌ها ثابت نیستند
const keys = new Set();
for (let i = 0; i < 300; i++) for (const p of buildRound()) keys.add(p.key);
assert.ok(keys.size > 600, `تنوع کم است: ${keys.size}`);
ok(`تنوع سؤال‌ها: ${keys.size} سؤال متفاوت در ۱۵۰۰ معما`);

// ۵) نرمال‌سازی ورودی
assert.equal(normalizeAnswer('  ۱۲۳۴  '), '1234');
assert.equal(normalizeAnswer('٤٥'), '45');
assert.equal(normalizeAnswer('  HeLLo  '), 'hello');
assert.equal(normalizeAnswer('كيمي'), 'کیمی');
assert.equal(normalizeAnswer('آتش'), 'اتش');
assert.equal(parseNumeric('۱۲٬۵۰۰'), 12500);
assert.equal(parseNumeric('12,500'), 12500);
assert.equal(parseNumeric('x1'), null);
assert.equal(formatTime(65000), '01:05');
ok('نرمال‌سازی: trim، ارقام فارسی/عربی، حروف بزرگ و کوچک، جداکننده‌ی هزارگان');

// ۶) ذخیره‌سازی
storage.clearLeaderboard();
assert.deepEqual(storage.getLeaderboard(), []);
const e1 = storage.addScore({ name: 'الف', totalMs: 90000, hints: 1 });
const e2 = storage.addScore({ name: 'ب', totalMs: 60000, hints: 0 });
const e3 = storage.addScore({ name: 'ج', totalMs: 60000, hints: 2 });
let lb = storage.getLeaderboard();
assert.deepEqual(lb.map((e) => e.id), [e2.id, e3.id, e1.id]);
for (let i = 0; i < 60; i++) storage.addScore({ name: 'x', totalMs: 1000 + i, hints: 0 });
assert.equal(storage.getLeaderboard().length, 50);
store['escapeLab.leaderboard.v1'] = '{خراب';
assert.deepEqual(storage.getLeaderboard(), []);
storage.addScore({ name: 'n', totalMs: 5, hints: 0 });
assert.equal(storage.getLeaderboard().length, 1);
storage.clearLeaderboard();
assert.equal(storage.getLeaderboard().length, 0);
storage.saveLastRoundKeys(['a', 'b']);
assert.deepEqual(storage.getLastRoundKeys(), ['a', 'b']);
ok('localStorage: مرتب‌سازی، سقف ۵۰ رکورد، داده‌ی خراب، پاک‌کردن، کلیدهای راند قبل');

// نمونه‌ی خروجی برای مرور چشمی
if (process.argv.includes('--samples')) {
  for (const p of buildRound()) {
    console.log('\n[' + p.typeId + '] ' + p.question);
    if (p.visual) console.log('   visual:', JSON.stringify(p.visual));
    console.log('   answer:', p.answer, '| hint:', p.hint);
  }
}

console.log(`\nهمه‌ی ${passed} گروه تست موفق بود.`);
