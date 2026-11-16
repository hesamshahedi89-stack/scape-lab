import { Component, createRef } from 'react';
import Timer from './Timer.jsx';
import Lock from './Lock.jsx';
import { checkAnswer, HINT_PENALTY_SECONDS } from '../game/puzzles.js';
import { pick, toFa } from '../game/utils.js';
import styles from './GameScreen.module.css';
import shared from './shared.module.css';

const WRONG_MESSAGES = [
  'رمز اشتباه است! دوباره تلاش کن.',
  'قفل تکان هم نخورد 🔒 یک بار دیگر.',
  'نه، این نیست. دقیق‌تر نگاه کن!',
  'جواب درست نیست؛ ولی نزدیک شدی؟',
];

class GameScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      input: '',
      status: 'idle', // 'idle' | 'wrong' | 'correct'
      message: '',
      hintsUsed: props.round.map(() => false),
      startedAt: Date.now(),
      endedAt: null,
    };
    this.inputRef = createRef();
    this.timeouts = [];
  }

  componentDidMount() {
    this.focusInput();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.index !== this.state.index) this.focusInput();
  }

  componentWillUnmount() {
    this.timeouts.forEach(clearTimeout);
  }

  later(fn, ms) {
    this.timeouts.push(setTimeout(fn, ms));
  }

  focusInput() {
    const el = this.inputRef.current;
    if (el) el.focus({ preventScroll: true });
  }

  countHints() {
    return this.state.hintsUsed.filter(Boolean).length;
  }

  handleChange = (e) => {
    this.setState({ input: e.target.value, message: '' });
  };

  handleHint = () => {
    const { index, hintsUsed, status } = this.state;
    if (status === 'correct' || hintsUsed[index]) return;
    const next = hintsUsed.slice();
    next[index] = true;
    this.setState({ hintsUsed: next });
    this.focusInput();
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { round, onFinish } = this.props;
    const { index, input, status, startedAt } = this.state;

    if (status !== 'idle') return;
    if (!input.trim()) {
      this.focusInput();
      return;
    }

    if (checkAnswer(round[index], input)) {
      const now = Date.now();
      const isLast = index === round.length - 1;
      const hints = this.countHints();
      const penaltySeconds = hints * HINT_PENALTY_SECONDS;

      // در آخرین معما، تایمر همان لحظه متوقف می‌شود
      this.setState({
        status: 'correct',
        message: '🔓 قفل باز شد!',
        endedAt: isLast ? now : null,
      });

      if (isLast) {
        const elapsedMs = now - startedAt;
        this.later(() => {
          onFinish({
            elapsedMs,
            penaltySeconds,
            hintsUsed: hints,
            totalMs: elapsedMs + penaltySeconds * 1000,
          });
        }, 1400);
      } else {
        this.later(() => {
          this.setState({ index: index + 1, input: '', status: 'idle', message: '' });
        }, 1000);
      }
    } else {
      this.setState({ status: 'wrong', message: pick(WRONG_MESSAGES) });
      this.later(() => this.setState({ status: 'idle' }), 600);
    }
  };

  renderVisual(visual) {
    if (!visual) return null;

    if (visual.kind === 'cells') {
      return (
        <div className={styles.cells} dir="ltr">
          {visual.items.map((item, i) => (
            <span
              key={i}
              className={`${styles.cell} ${item === '؟' ? styles.cellUnknown : ''}`}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (visual.kind === 'grid') {
      return (
        <div className={styles.grid} dir="ltr">
          {visual.rows.map((row, r) =>
            row.map((item, c) => (
              <span
                key={`${r}-${c}`}
                className={`${styles.gridCell} ${item === '؟' ? styles.cellUnknown : ''}`}
              >
                {item}
              </span>
            ))
          )}
        </div>
      );
    }

    if (visual.kind === 'text') {
      return (
        <div className={styles.bigText} dir={visual.dir || 'rtl'}>
          {visual.text}
        </div>
      );
    }

    if (visual.kind === 'list') {
      return (
        <ol className={styles.clues}>
          {visual.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    }

    return null;
  }

  render() {
    const { round, playerName } = this.props;
    const { index, input, status, message, hintsUsed, startedAt, endedAt } = this.state;
    const puzzle = round[index];
    const hintCount = this.countHints();
    const hintUsed = hintsUsed[index];

    const cardClass = [
      shared.card,
      styles.card,
      status === 'wrong' ? styles.shake : '',
      status === 'correct' ? styles.solved : '',
    ].join(' ');

    return (
      <main className={styles.screen}>
        <header className={styles.topBar}>
          <div className={styles.player} title={playerName}>
            👤 {playerName}
          </div>
          <Timer
            startedAt={startedAt}
            endedAt={endedAt}
            penaltySeconds={hintCount * HINT_PENALTY_SECONDS}
          />
          <div className={styles.hintCount}>💡 {toFa(hintCount)}</div>
        </header>

        <ol className={styles.progress} aria-label="پیشرفت بازی">
          {round.map((p, i) => {
            const done = i < index || (i === index && status === 'correct');
            const current = i === index && !done;
            return (
              <li
                key={p.id}
                className={`${styles.step} ${done ? styles.stepDone : ''} ${
                  current ? styles.stepCurrent : ''
                }`}
                aria-current={current ? 'step' : undefined}
              >
                {done ? '✓' : toFa(i + 1)}
              </li>
            );
          })}
        </ol>

        <div key={puzzle.id} className={styles.enterWrap}>
          <section className={cardClass}>
            <div className={styles.cardHead}>
              <Lock open={status === 'correct'} />
              <div>
                <div className={styles.stepLabel}>
                  معمای {toFa(index + 1)} از {toFa(round.length)}
                </div>
                <h2 className={styles.title}>
                  <span aria-hidden="true">{puzzle.icon}</span> {puzzle.title}
                </h2>
              </div>
            </div>

            <p className={styles.question}>{puzzle.question}</p>

            {this.renderVisual(puzzle.visual)}

            {hintUsed && (
              <div className={styles.hintBox} role="note">
                💡 {puzzle.hint}
              </div>
            )}

            <form className={styles.form} onSubmit={this.handleSubmit} autoComplete="off">
              <input
                ref={this.inputRef}
                className={styles.input}
                type="text"
                value={input}
                onChange={this.handleChange}
                inputMode={puzzle.answerType === 'number' ? 'numeric' : 'text'}
                enterKeyHint="go"
                dir="auto"
                placeholder="پاسخ را اینجا بنویس…"
                aria-label="پاسخ"
                aria-invalid={status === 'wrong'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={status === 'correct'}
              />
              <div className={styles.actions}>
                <button
                  type="submit"
                  className={`${shared.btn} ${shared.primary}`}
                  disabled={status === 'correct'}
                >
                  🔑 باز کن
                </button>
                <button
                  type="button"
                  className={`${shared.btn} ${shared.ghost}`}
                  onClick={this.handleHint}
                  disabled={hintUsed || status === 'correct'}
                >
                  {hintUsed ? '💡 راهنما استفاده شد' : `💡 راهنما (${toFa(HINT_PENALTY_SECONDS)} ثانیه جریمه)`}
                </button>
              </div>
            </form>

            <p
              className={`${styles.message} ${
                status === 'wrong' ? styles.messageWrong : ''
              } ${status === 'correct' ? styles.messageOk : ''}`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          </section>
        </div>
      </main>
    );
  }
}

export default GameScreen;
