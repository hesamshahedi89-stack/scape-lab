import { Component } from 'react';
import { clearLeaderboard } from '../game/storage.js';
import { toFa } from '../game/utils.js';
import { ROUND_SIZE, HINT_PENALTY_SECONDS } from '../game/puzzles.js';
import styles from './StartScreen.module.css';
import shared from './shared.module.css';

class StartScreen extends Component {
  constructor(props) {
    super(props);
    this.state = { name: props.initialName || '', adminMessage: '' };
  }

  handleName = (e) => this.setState({ name: e.target.value });

  handleSubmit = (e) => {
    e.preventDefault();
    const name = this.state.name.trim().slice(0, 20) || 'ناشناس';
    this.props.onStart(name);
  };

  handleClear = () => {
    const ok = window.confirm(
      'همه‌ی رکوردهای جدول برترین‌ها پاک شود؟ این کار برگشت‌پذیر نیست.'
    );
    if (ok) {
      clearLeaderboard();
      this.setState({ adminMessage: 'جدول برترین‌ها پاک شد.' });
    }
  };

  render() {
    const { name, adminMessage } = this.state;
    return (
      <main className={styles.screen}>
        <section className={`${shared.card} ${styles.panel}`}>
          <div className={styles.flask} aria-hidden="true">⚗️</div>
          <h1 className={styles.title}>فرار از آزمایشگاه قفل‌شده</h1>
          <p className={styles.tagline}>قفل‌ها منتظر توست…</p>

          <p className={styles.story}>
            دانشمندِ مرموز، آزمایشگاه را از داخل قفل کرده و رفته است. تنها راه خروج، باز کردن{' '}
            {toFa(ROUND_SIZE)} قفل است و هر قفل یک معما دارد. هرچه سریع‌تر پاسخ بدهی، در جدول
            برترین‌ها بالاتر می‌روی.
          </p>

          <ul className={styles.rules}>
            <li>⏱ تایمر از لحظه‌ی شروع می‌دود.</li>
            <li>
              💡 هر معما یک راهنما دارد؛ استفاده از آن {toFa(HINT_PENALTY_SECONDS)} ثانیه
              جریمه دارد.
            </li>
            <li>🔁 سؤال‌ها هر بار تازه ساخته می‌شوند.</li>
          </ul>

          <form className={styles.form} onSubmit={this.handleSubmit}>
            <label className={styles.label} htmlFor="player-name">
              نام بازیکن
            </label>
            <input
              id="player-name"
              className={styles.input}
              type="text"
              value={name}
              onChange={this.handleName}
              maxLength={20}
              placeholder="مثلاً: سارا"
              autoComplete="off"
              autoFocus
            />
            <button type="submit" className={`${shared.btn} ${shared.primary} ${styles.start}`}>
              🔓 شروع
            </button>
          </form>
        </section>

        <footer className={styles.admin}>
          <button
            type="button"
            className={styles.adminBtn}
            onClick={this.handleClear}
            title="پاک‌کردن جدول برترین‌ها (مخصوص مدیر نمایشگاه)"
          >
            🗑 پاک‌کردن جدول
          </button>
          {adminMessage && (
            <span className={styles.adminMsg} role="status">
              {adminMessage}
            </span>
          )}
        </footer>
      </main>
    );
  }
}

export default StartScreen;
