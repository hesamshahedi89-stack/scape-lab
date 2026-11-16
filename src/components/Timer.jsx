import { Component } from 'react';
import { formatTime, toFa } from '../game/utils.js';
import styles from './Timer.module.css';

/**
 * تایمر کلی بازی.
 * props:
 *   startedAt      زمان شروع (ms)
 *   endedAt        زمان پایان (ms) یا null؛ با مقدار غیر null تایمر ثابت می‌ماند
 *   penaltySeconds مجموع جریمه‌ی راهنماها (ثانیه) که به زمان اضافه می‌شود
 */
class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = { now: Date.now(), flashKey: 0 };
    this.intervalId = null;
  }

  componentDidMount() {
    this.intervalId = setInterval(() => this.setState({ now: Date.now() }), 250);
  }

  componentDidUpdate(prevProps) {
    // با هر جریمه‌ی تازه، برچسب جریمه دوباره انیمیشن می‌خورد
    if (this.props.penaltySeconds > prevProps.penaltySeconds) {
      this.setState((s) => ({ flashKey: s.flashKey + 1 }));
    }
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  render() {
    const { startedAt, endedAt, penaltySeconds } = this.props;
    const end = endedAt || this.state.now;
    const totalMs = Math.max(0, end - startedAt) + penaltySeconds * 1000;

    return (
      <div className={styles.timer} role="timer" aria-label="زمان کل بازی">
        <span className={styles.label}>⏱ زمان کل</span>
        <span className={styles.digits} dir="ltr">
          {formatTime(totalMs)}
        </span>
        {penaltySeconds > 0 && (
          <span key={this.state.flashKey} className={styles.penalty}>
            جریمه: {toFa(penaltySeconds)} ثانیه
          </span>
        )}
      </div>
    );
  }
}

export default Timer;
