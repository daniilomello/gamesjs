import { Play, User, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { ANIMATIONS } from '@app/constants';
import { TRUCO_VARIANT_LIST } from '@app/helpers/truco-variants';
import { TrucoPlayerCount, TrucoVariantId } from '@app/types/truco';
import { cn } from '@app/utils';

type TrucoSetupProps = {
  onStart: (variantId: TrucoVariantId, players: TrucoPlayerCount) => void;
};

const PLAYER_OPTIONS = [
  {
    players: 4,
    label: 'Duplas',
    detail: 'Você e um parceiro contra dois',
    icon: Users,
  },
  {
    players: 2,
    label: 'Mano a mano',
    detail: 'Você contra um adversário',
    icon: User,
  },
] as const;

export function TrucoSetup({ onStart }: TrucoSetupProps) {
  const [variantId, setVariantId] = useState<TrucoVariantId>('paulista');
  const [players, setPlayers] = useState<TrucoPlayerCount>(4);

  return (
    <motion.div
      {...ANIMATIONS.fadeInUp}
      className="mx-auto flex w-full max-w-3xl flex-col gap-8"
    >
      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Modalidade</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {TRUCO_VARIANT_LIST.map((variant) => {
            const selected = variant.id === variantId;

            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setVariantId(variant.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-xl border-2 bg-blue-100 p-4 text-left transition-colors',
                  selected
                    ? 'border-pink'
                    : 'border-transparent hover:border-gray-200',
                )}
              >
                <span className="text-lg font-bold text-white">
                  {variant.name}
                </span>
                <span className="text-sm text-gray-100">{variant.tagline}</span>
                <span className="mt-auto pt-2 text-xs text-gray-100">
                  Mão vale{' '}
                  <b className="text-white">{variant.stakes.join(' · ')}</b>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Jogadores</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLAYER_OPTIONS.map(
            ({ players: count, label, detail, icon: Icon }) => {
              const selected = count === players;

              return (
                <button
                  key={count}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPlayers(count)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 bg-blue-100 p-4 text-left transition-colors',
                    selected
                      ? 'border-pink'
                      : 'border-transparent hover:border-gray-200',
                  )}
                >
                  <Icon className="h-6 w-6 shrink-0 text-pink" />
                  <span className="flex flex-col">
                    <span className="font-bold text-white">{label}</span>
                    <span className="text-sm text-gray-100">{detail}</span>
                  </span>
                </button>
              );
            },
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={() => onStart(variantId, players)}
        className="flex items-center justify-center gap-2 self-center rounded-lg bg-pink px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Play className="h-5 w-5" />
        Começar partida
      </button>
    </motion.div>
  );
}
