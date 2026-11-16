/* eslint-disable react/require-default-props */
import { Spade } from 'lucide-react';

import { SUIT_SYMBOLS } from '@app/helpers/truco-variants';
import { TrucoCard } from '@app/types/truco';
import { cn } from '@app/utils';

type PlayingCardProps = {
  card?: TrucoCard;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  manilha?: boolean;
  winner?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
};

const SIZES = {
  sm: 'h-12 w-8 rounded-md text-[10px]',
  md: 'h-20 w-14 rounded-lg text-sm',
  lg: 'h-24 w-16 rounded-lg text-base xs:h-28 xs:w-20 xs:text-lg',
};

const SUIT_SIZES = {
  sm: 'text-base',
  md: 'text-3xl',
  lg: 'text-4xl xs:text-5xl',
};

export function PlayingCard({
  card,
  faceDown = false,
  size = 'md',
  manilha = false,
  winner = false,
  dimmed = false,
  onClick,
  disabled = false,
  label,
}: PlayingCardProps) {
  const showFace = !!card && !faceDown;
  const isRed = card?.suit === 'copas' || card?.suit === 'ouros';
  const className = cn(
    'relative shrink-0 select-none border shadow-md transition-all duration-200',
    SIZES[size],
    showFace
      ? 'border-slate-300 bg-white'
      : 'border-white/30 bg-gradient-to-br from-pink to-fuchsia-900',
    showFace && (isRed ? 'text-rose-600' : 'text-slate-900'),
    manilha && showFace && 'ring-2 ring-amber-400',
    winner && 'ring-4 ring-pink shadow-lg shadow-pink/50',
    dimmed && 'opacity-50',
    onClick &&
      !disabled &&
      'cursor-pointer hover:-translate-y-3 focus-visible:-translate-y-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink',
    onClick && disabled && 'cursor-not-allowed',
  );

  const content = showFace ? (
    <>
      <span className="absolute left-1 top-0.5 flex flex-col items-center font-bold leading-none">
        {card.rank}
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
      {manilha && size !== 'sm' && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs text-slate-900 shadow">
          ★
        </span>
      )}
    </>
  ) : (
    <span className="absolute inset-1 flex items-center justify-center rounded border border-white/25">
      {size !== 'sm' && <Spade className="h-5 w-5 text-white/60" />}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className} role="img" aria-label={label}>
      {content}
    </div>
  );
}
