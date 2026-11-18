/* eslint-disable jsx-a11y/no-autofocus */
import { motion } from 'motion/react';

import { formatChips, POKER_MODES } from '@app/helpers/poker-cards';
import { HUMAN_SEAT } from '@app/helpers/poker-seats';
import { PokerState } from '@app/types/poker';

type PokerGameOverProps = {
  state: PokerState;
  onRestart: () => void;
  onQuit: () => void;
};

function getSummary(state: PokerState): { title: string; detail: string } {
  const mode = POKER_MODES[state.modeId];
  const { chips } = state.players[HUMAN_SEAT];

  if (mode.rebuy) {
    const profit = chips - mode.startingStack;
    let title = '😐 Saiu no zero a zero';
    if (profit > 0) title = '🤑 Saiu no lucro!';
    if (profit < 0)
      title = chips === 0 ? '💸 Você quebrou' : '📉 Saiu no prejuízo';

    return {
      title,
      detail: `${profit >= 0 ? '+' : '−'}${formatChips(Math.abs(profit))} fichas em ${state.handNumber} ${state.handNumber === 1 ? 'mão' : 'mãos'}`,
    };
  }

  if (state.place === 1) {
    return {
      title: '🏆 Você ganhou o torneio!',
      detail: `Ficou com todas as ${formatChips(chips)} fichas em ${state.handNumber} ${state.handNumber === 1 ? 'mão' : 'mãos'}`,
    };
  }

  return {
    title: '😵 Você foi eliminado',
    detail: `Terminou em ${state.place}º lugar de ${state.players.length}, na mão ${state.handNumber}`,
  };
}

export function PokerGameOver({
  state,
  onRestart,
  onQuit,
}: PokerGameOverProps) {
  if (state.phase !== 'game-over') return null;

  const { title, detail } = getSummary(state);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.8 }}
      role="dialog"
      aria-modal="true"
      aria-label="Fim do jogo"
      className="fixed inset-0 z-30 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="max-w-sm rounded-xl bg-white p-6 text-center text-blue-200">
        <h2 className="mb-2 text-2xl font-bold">{title}</h2>
        <p className="mb-5 text-lg">{detail}</p>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg bg-pink px-4 py-2 font-medium text-white outline-none hover:bg-pink/80 focus:ring-2 focus:ring-pink focus:ring-offset-2"
            autoFocus
          >
            Jogar de novo
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="rounded-lg bg-blue-100 px-4 py-2 font-medium text-white outline-none hover:opacity-90 focus:ring-2 focus:ring-pink focus:ring-offset-2"
          >
            Trocar modalidade
          </button>
        </div>
      </div>
    </motion.div>
  );
}
