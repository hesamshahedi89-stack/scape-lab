import { Component } from 'react';
import Leaderboard from './Leaderboard.jsx';
import { getLeaderboard, clearLeaderboard } from '../game/storage.js';
import { formatTime, toFa } from '../game/utils.js';
import styles from './ResultScreen.module.css';
import shared from './shared.module.css';

class ResultScreen extends Component {
  constructor(props) {
    super(props);
    this.state = { entries: getLeaderboard() };
  }

  handleClear = () => {
    const ok = window.confirm(
      'همه‌ی رکوردهای جدول برترین‌ها پاک شود؟ این کار برگشت‌پذیر نیست.'
    );
    if (ok) {
      clearLeaderboard();
      this.setState({ entries: [] });
    }
  };

  render() {
    const { result, playerName, onReplay, onNewPlayer } = this.props;
    const { entries } = this.state;
    const rank = entries.findIndex((e) => e.id === result.entry.id) + 1;

    return (
      <main className={styles.screen}>
        <section className={`${shared.card} ${styles.panel}`}>
          <div className={styles.door} aria-hidden="true">🔓</div>
          <h1 className={styles.title}>آزاد شدی، {playerName}!</h1>
          <p className={styles.sub}>همه‌ی قفل‌های آزمایشگاه باز شد.</p>

          <div className={styles.finalLabel}>زمان نهایی (با احتساب جریمه‌ها)</div>
          <div className={styles.finalTime} dir="ltr">
            {formatTime(result.totalMs)}
          </div>

          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>زمان خالص</dt>
              <dd dir="ltr">{formatTime(result.elapsedMs)}</dd>
            </div>
            <div className={styles.stat}>
              <dt>راهنماها</dt>
              <dd>{toFa(result.hintsUsed)}</dd>
            </div>
            <div className={styles.stat}>
              <dt>جریمه</dt>
              <dd>{toFa(result.penaltySeconds)} ثانیه</dd>
            </div>
            {rank > 0 && (
              <div className={styles.stat}>
                <dt>رتبه‌ی تو</dt>
                <dd>
                  {toFa(rank)} از {toFa(entries.length)}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className={`${shared.card} ${styles.panel}`}>
          <Leaderboard
            entries={entries}
            highlightId={result.entry.id}
            onClear={this.handleClear}
          />
        </section>

        <div className={styles.buttons}>
          <button
            type="button"
            className={`${shared.btn} ${shared.primary}`}
            onClick={onReplay}
          >
            🔁 بازی دوباره
          </button>
          <button
            type="button"
            className={`${shared.btn} ${shared.ghost}`}
            onClick={onNewPlayer}
          >
            👤 بازیکن جدید
          </button>
        </div>
      </main>
    );
  }
}

export default ResultScreen;
