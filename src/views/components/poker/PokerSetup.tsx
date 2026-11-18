import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { ANIMATIONS } from '@app/constants';
import { POKER_MODE_LIST } from '@app/helpers/poker-cards';
import { SEAT_NAMES } from '@app/helpers/poker-seats';
import { PokerModeId, PokerPlayerCount } from '@app/types/poker';
import { cn } from '@app/utils';

type PokerSetupProps = {
  onStart: (modeId: PokerModeId, players: PokerPlayerCount) => void;
};

const PLAYER_OPTIONS: PokerPlayerCount[] = [2, 3, 4, 5, 6];

export function PokerSetup({ onStart }: PokerSetupProps) {
  const [modeId, setModeId] = useState<PokerModeId>('torneio');
  const [players, setPlayers] = useState<PokerPlayerCount>(6);

  return (
    <motion.div
      {...ANIMATIONS.fadeInUp}
      className="mx-auto flex w-full max-w-3xl flex-col gap-8"
    >
      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Modalidade</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {POKER_MODE_LIST.map((mode) => {
            const selected = mode.id === modeId;
            const [small, big] = mode.blindLevels[0];

            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setModeId(mode.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border-2 bg-blue-100 p-4 text-left transition-colors',
                  selected
                    ? 'border-pink'
                    : 'border-transparent hover:border-gray-200',
                )}
              >
                <span className="text-lg font-bold text-white">
                  {mode.name}
                </span>
                <span className="text-sm text-gray-100">{mode.tagline}</span>
                <span className="mt-auto pt-2 text-xs text-gray-100">
                  Fichas{' '}
                  <b className="text-white">
                    {mode.startingStack.toLocaleString('pt-BR')}
                  </b>{' '}
                  · blinds{' '}
                  <b className="text-white">
                    {small}/{big}
                  </b>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Jogadores na mesa</h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {PLAYER_OPTIONS.map((count) => {
            const selected = count === players;

            return (
              <button
                key={count}
                type="button"
                aria-pressed={selected}
                onClick={() => setPlayers(count)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border-2 bg-blue-100 px-2 py-3 transition-colors',
                  selected
                    ? 'border-pink'
                    : 'border-transparent hover:border-gray-200',
                )}
              >
                <span className="text-2xl font-bold text-white">{count}</span>
                <span className="text-center text-[11px] leading-tight text-gray-100 sm:text-xs">
                  {count === 2 ? 'mano a mano' : `você + ${count - 1}`}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-gray-100">
          Na mesa: {SEAT_NAMES.slice(1, players).join(', ')}.
        </p>
      </section>

      <button
        type="button"
        onClick={() => onStart(modeId, players)}
        className="flex items-center justify-center gap-2 self-center rounded-lg bg-pink px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Play className="h-5 w-5" />
        Sentar na mesa
      </button>
    </motion.div>
  );
}
