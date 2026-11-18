/* eslint-disable react/require-default-props */
import { Club } from 'lucide-react';

import { rankLabel, SUIT_SYMBOLS } from '@app/helpers/poker-cards';
import { PokerCard as PokerCardType } from '@app/types/poker';
import { cn } from '@app/utils';

type PokerCardProps = {
  card?: PokerCardType;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  dimmed?: boolean;
  label?: string;
};

const SIZES = {
  sm: 'h-11 w-8 rounded-md text-[11px]',
  md: 'h-[4.2rem] w-12 rounded-lg text-sm sm:h-20 sm:w-14',
  lg: 'h-24 w-16 rounded-lg text-base xs:h-28 xs:w-20 xs:text-lg',
};

const SUIT_SIZES = {
  sm: 'text-sm',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-4xl xs:text-5xl',
};

export function PokerCard({
  card,
  faceDown = false,
  size = 'md',
  highlight = false,
  dimmed = false,
  label,
}: PokerCardProps) {
  const showFace = !!card && !faceDown;
  const isRed = card?.suit === 'copas' || card?.suit === 'ouros';

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative shrink-0 select-none border shadow-md transition-all duration-200',
        SIZES[size],
        showFace
          ? 'border-slate-300 bg-white'
          : 'border-white/30 bg-gradient-to-br from-pink to-fuchsia-900',
        showFace && (isRed ? 'text-rose-600' : 'text-slate-900'),
        highlight && 'ring-[3px] ring-amber-400 shadow-lg shadow-amber-400/40',
        dimmed && 'opacity-40',
      )}
    >
      {showFace ? (
        <>
          <span className="absolute left-1 top-0.5 flex flex-col items-center font-bold leading-none">
            {rankLabel(card.rank)}
            {size !== 'sm' && (
              <span className="text-[0.8em]">{SUIT_SYMBOLS[card.suit]}</span>
            )}
          </span>
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              size === 'sm' && 'items-end pb-0.5',
              SUIT_SIZES[size],
            )}
          >
            {SUIT_SYMBOLS[card.suit]}
          </span>
        </>
      ) : (
        <span className="absolute inset-1 flex items-center justify-center rounded border border-white/25">
          {size !== 'sm' && <Club className="h-5 w-5 text-white/60" />}
        </span>
      )}
    </div>
  );
}
