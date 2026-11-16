import { Component } from 'react';
import { formatTime, toFa } from '../game/utils.js';
import styles from './Leaderboard.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * جدول برترین‌ها.
 * props:
 *   entries      آرایه‌ی رکوردهای مرتب‌شده
 *   highlightId  شناسه‌ی رکوردی که باید برجسته شود (بازیکن فعلی)
 *   limit        تعداد ردیف‌های نمایش (پیش‌فرض ۱۰)
 *   onClear      اگر داده شود، دکمه‌ی کوچک پاک‌کردن جدول نمایش داده می‌شود
 */
class Leaderboard extends Component {
  render() {
    const { entries, highlightId, onClear, limit = 10 } = this.props;
    const rows = entries.slice(0, limit);

    return (
      <section className={styles.board} aria-label="جدول برترین‌ها">
        <h3 className={styles.heading}>🏆 ۱۰ نفر برتر</h3>

        {rows.length === 0 ? (
          <p className={styles.empty}>هنوز رکوردی ثبت نشده است.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>رتبه</th>
                <th>نام</th>
                <th>زمان</th>
                <th>راهنما</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={e.id} className={e.id === highlightId ? styles.me : ''}>
                  <td className={styles.rank}>{MEDALS[i] || toFa(i + 1)}</td>
                  <td className={styles.name} title={e.name}>
                    {e.name}
                  </td>
                  <td className={styles.time} dir="ltr">
                    {formatTime(e.totalMs)}
                  </td>
                  <td>{toFa(e.hints)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {onClear && (
          <button type="button" className={styles.clear} onClick={onClear}>
            🗑 پاک‌کردن جدول (مدیر)
          </button>
        )}
      </section>
    );
  }
}

export default Leaderboard;
