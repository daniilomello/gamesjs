import { useEffect, useState } from 'react';

import { chooseBotAction } from '@app/helpers/poker-ai';
import {
  applyAction,
  createGame,
  finishHand,
  getLegalActions,
  isHumanTurn,
  leaveTable,
  nextStreet,
  swapHoleCard,
} from '@app/helpers/poker-logic';
import { HUMAN_SEAT } from '@app/helpers/poker-seats';
import {
  PokerAction,
  PokerModeId,
  PokerPlayerCount,
  PokerState,
} from '@app/types/poker';

const DELAYS = {
  botAction: 850,
  /** Bots play faster once the human is out of the hand. */
  botActionWatching: 450,
  streetEnd: 900,
  runOut: 1300,
  handEnd: 2600,
  showdown: 5000,
};

/** What the table does on its own after a pause: bot moves and street/hand transitions. */
function getAutomaticStep(
  state: PokerState,
): { delay: number; run: () => PokerState } | null {
  switch (state.phase) {
    case 'betting': {
      const seat = state.turn;
      if (seat === HUMAN_SEAT) return null;

      const human = state.players[HUMAN_SEAT];
      const watching = human.folded || human.out || human.allIn;

      return {
        delay: watching ? DELAYS.botActionWatching : DELAYS.botAction,
        run: () => applyAction(state, seat, chooseBotAction(state, seat)),
      };
    }
    case 'street-end':
      return {
        delay: state.reveal ? DELAYS.runOut : DELAYS.streetEnd,
        run: () => nextStreet(state),
      };
    case 'hand-end':
      return {
        delay: state.result?.showdown ? DELAYS.showdown : DELAYS.handEnd,
        run: () => finishHand(state),
      };
    default:
      return null;
  }
}

export function usePoker() {
  const [state, setState] = useState<PokerState | null>(null);
  const [peekAll, setPeekAll] = useState(false);
  const [swapMode, setSwapMode] = useState(false);

  // Hacks: "O" shows or hides every card on the table, "S" turns on trading
  // your cards by clicking them.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat)
        return;
      const key = event.key.toLowerCase();
      if (key !== 'o' && key !== 's') return;

      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      if (key === 'o') setPeekAll((prev) => !prev);
      else setSwapMode((prev) => !prev);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!state) return undefined;

    const step = getAutomaticStep(state);
    if (!step) return undefined;

    const timer = setTimeout(() => setState(step.run()), step.delay);
    return () => clearTimeout(timer);
  }, [state]);

  function startGame(modeId: PokerModeId, players: PokerPlayerCount) {
    setState(createGame(modeId, players));
  }

  function restartGame() {
    if (state)
      startGame(state.modeId, state.players.length as PokerPlayerCount);
  }

  function quitGame() {
    setState(null);
  }

  function onAction(action: PokerAction) {
    if (state) setState(applyAction(state, HUMAN_SEAT, action));
  }

  function onNextHand() {
    if (state?.phase === 'hand-end') setState(finishHand(state));
  }

  function onSwapCard(cardId: string) {
    if (state) setState(swapHoleCard(state, HUMAN_SEAT, cardId));
  }

  function onLeaveTable() {
    if (state) setState(leaveTable(state));
  }

  const humanTurn = !!state && isHumanTurn(state);

  return {
    state,
    peekAll,
    swapMode,
    isHumanTurn: humanTurn,
    legal: state && humanTurn ? getLegalActions(state, HUMAN_SEAT) : null,
    startGame,
    restartGame,
    quitGame,
    onAction,
    onNextHand,
    onSwapCard,
    onLeaveTable,
  };
}
