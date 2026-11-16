import { Component } from 'react';
import styles from './Lock.module.css';

/** قفل ساخته‌شده با CSS؛ با open=true انیمیشن باز شدن اجرا می‌شود */
class Lock extends Component {
  render() {
    const { open } = this.props;
    return (
      <div
        className={`${styles.lock} ${open ? styles.open : ''}`}
        dir="ltr"
        aria-hidden="true"
      >
        <div className={styles.shackle} />
        <div className={styles.body}>
          <div className={styles.keyhole} />
        </div>
      </div>
    );
  }
}

export default Lock;
