/* eslint-disable jsx-a11y/no-autofocus */
import { motion } from 'motion/react';

import { HUMAN_TEAM } from '@app/hooks/use-truco';
import { TrucoState } from '@app/types/truco';

type TrucoGameOverProps = {
  state: TrucoState;
  onRestart: () => void;
  onQuit: () => void;
};

export function TrucoGameOver({
  state,
  onRestart,
  onQuit,
}: TrucoGameOverProps) {
  if (state.phase !== 'game-over') return null;

  const won = state.winner === HUMAN_TEAM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Fim da partida"
      className="fixed inset-0 z-30 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="max-w-sm rounded-xl bg-white p-6 text-center text-blue-200">
        <h2 className="mb-2 text-2xl font-bold">
          {won ? '🎉 Vocês venceram! 🎉' : '😵 Eles venceram'}
        </h2>
        <p className="mb-5 text-xl">
          Nós <b>{state.scores[0]}</b> × <b>{state.scores[1]}</b> Eles
        </p>

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
