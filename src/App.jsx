import { Component } from 'react';
import StartScreen from './components/StartScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import { buildRound } from './game/puzzles.js';
import { addScore, getLastRoundKeys, saveLastRoundKeys } from './game/storage.js';
import styles from './App.module.css';

class App extends Component {
  state = {
    screen: 'start', // 'start' | 'game' | 'result'
    playerName: '',
    round: null,
    roundId: 0,
    result: null,
  };

  /** ساخت راند جدید؛ سؤال‌های راند قبلی تکرار نمی‌شوند */
  startRound = (name) => {
    const round = buildRound(getLastRoundKeys());
    saveLastRoundKeys(round.map((p) => p.key));
    this.setState((s) => ({
      screen: 'game',
      playerName: name,
      round,
      roundId: s.roundId + 1,
      result: null,
    }));
  };

  /** پایان بازی: ثبت رکورد در localStorage و رفتن به صفحه‌ی نتیجه */
  handleFinish = (stats) => {
    const entry = addScore({
      name: this.state.playerName,
      totalMs: stats.totalMs,
      hints: stats.hintsUsed,
    });
    this.setState({ screen: 'result', result: { ...stats, entry } });
  };

  handleReplay = () => this.startRound(this.state.playerName);

  handleNewPlayer = () => this.setState({ screen: 'start', result: null, round: null });

  render() {
    const { screen, playerName, round, roundId, result } = this.state;
    return (
      <div className={styles.app}>
        <div className={styles.content}>
          {screen === 'start' && (
            <StartScreen initialName={playerName} onStart={this.startRound} />
          )}
          {screen === 'game' && (
            <GameScreen
              key={roundId}
              round={round}
              playerName={playerName}
              onFinish={this.handleFinish}
            />
          )}
          {screen === 'result' && (
            <ResultScreen
              result={result}
              playerName={playerName}
              onReplay={this.handleReplay}
              onNewPlayer={this.handleNewPlayer}
            />
          )}
        </div>
      </div>
    );
  }
}

export default App;
