import { useEffect, useState } from 'react';

import {
  chooseBotAction,
  chooseBotDecision,
  chooseBotResponse,
} from '@app/helpers/truco-ai';
import {
  callTruco,
  canCallTruco,
  canPlayFaceDown,
  createGame,
  dealHand,
  decideHand,
  finishRound,
  playCard,
  respondTruco,
  startHand,
} from '@app/helpers/truco-logic';
import {
  TrucoPlayerCount,
  TrucoResponse,
  TrucoState,
  TrucoVariantId,
} from '@app/types/truco';

export const HUMAN_SEAT = 0;
export const HUMAN_TEAM = 0;

const DELAYS = {
  botPlay: 900,
  botResponse: 1300,
  roundEnd: 1500,
  handEnd: 2600,
};

/** What the table does on its own after a pause: bot moves and round/hand transitions. */
function getAutomaticStep(
  state: TrucoState,
): { delay: number; run: () => TrucoState } | null {
  switch (state.phase) {
    case 'playing': {
      const seat = state.turn;
      if (seat === HUMAN_SEAT) return null;

      return {
        delay: DELAYS.botPlay,
        run: () => {
          const action = chooseBotAction(state, seat);

          return action.type === 'truco'
            ? callTruco(state, seat)
            : playCard(state, seat, action.cardId);
        },
      };
    }
    case 'response':
      // A bet asked by the human's team is answered by the bots.
      if (state.pending?.team !== HUMAN_TEAM) return null;

      return {
        delay: DELAYS.botResponse,
        run: () => respondTruco(state, chooseBotResponse(state)),
      };
    case 'decision':
      if (state.decisionTeam === HUMAN_TEAM) return null;

      return {
        delay: DELAYS.botResponse,
        run: () => decideHand(state, chooseBotDecision(state)),
      };
    case 'round-end':
      return { delay: DELAYS.roundEnd, run: () => finishRound(state) };
    case 'hand-end':
      return {
        delay: DELAYS.handEnd,
        run: () => startHand(state, dealHand(state.variantId, state.players)),
      };
    default:
      return null;
  }
}

export function useTruco() {
  const [state, setState] = useState<TrucoState | null>(null);
  const [faceDown, setFaceDown] = useState(false);

  useEffect(() => {
    if (!state) return undefined;

    const step = getAutomaticStep(state);
    if (!step) return undefined;

    const timer = setTimeout(() => setState(step.run()), step.delay);
    return () => clearTimeout(timer);
  }, [state]);

  function startGame(variantId: TrucoVariantId, players: TrucoPlayerCount) {
    setFaceDown(false);
    setState(createGame(variantId, players, dealHand(variantId, players)));
  }

  function restartGame() {
    if (state) startGame(state.variantId, state.players);
  }

  function quitGame() {
    setState(null);
  }

  function onPlayCard(cardId: string) {
    if (!state) return;

    setState(playCard(state, HUMAN_SEAT, cardId, faceDown));
    setFaceDown(false);
  }

  function onCallTruco() {
    if (state) setState(callTruco(state, HUMAN_SEAT));
  }

  function onRespond(response: TrucoResponse) {
    if (state) setState(respondTruco(state, response, HUMAN_SEAT));
  }

  function onDecide(play: boolean) {
    if (state) setState(decideHand(state, play));
  }

  const isHumanTurn = state?.phase === 'playing' && state.turn === HUMAN_SEAT;

  return {
    state,
    faceDown: faceDown && !!state && isHumanTurn && canPlayFaceDown(state),
    isHumanTurn,
    canCallTruco: !!state && canCallTruco(state, HUMAN_SEAT),
    canPlayFaceDown: !!state && isHumanTurn && canPlayFaceDown(state),
    startGame,
    restartGame,
    quitGame,
    onPlayCard,
    onCallTruco,
    onRespond,
    onDecide,
    onToggleFaceDown: () => setFaceDown((prev) => !prev),
  };
}
