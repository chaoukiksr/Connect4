import { ref } from 'vue';
import { useGameStateStore } from '../stores/gameState';

/**
 * Manages replay mode: auto-play, step forward/backward, go to start/end.
 * Works by manipulating historyIndex via undo() / redo() on the gameState store.
 */
export function useReplay() {
  const gameState = useGameStateStore();

  const isReplaying = ref(false);
  const replaySpeed = ref(700); // ms per move
  let replayInterval = null;

  const stopAutoReplay = () => {
    if (replayInterval) {
      clearInterval(replayInterval);
      replayInterval = null;
    }
    isReplaying.value = false;
  };

  const startAutoReplay = () => {
    if (isReplaying.value) {
      stopAutoReplay();
      return;
    }
    isReplaying.value = true;
    replayInterval = setInterval(() => {
      const success = gameState.redo();
      if (!success) stopAutoReplay(); // reached the end
    }, replaySpeed.value);
  };

  const stepForward = () => {
    stopAutoReplay();
    gameState.redo();
  };

  const stepBackward = () => {
    stopAutoReplay();
    gameState.undo();
  };

  const goToStart = () => {
    stopAutoReplay();
    // Undo until we're at the beginning
    while (gameState.historyIndex > -1) {
      gameState.undo();
    }
  };

  const goToEnd = () => {
    stopAutoReplay();
    while (gameState.historyIndex < gameState.moveHistory.length - 1) {
      gameState.redo();
    }
  };

  return {
    isReplaying,
    replaySpeed,
    startAutoReplay,
    stopAutoReplay,
    stepForward,
    stepBackward,
    goToStart,
    goToEnd,
  };
}
