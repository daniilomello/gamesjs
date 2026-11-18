import { ArrowUp, Check, FastForward, Flag, PhoneCall } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatChips } from '@app/helpers/poker-cards';
import { getPot } from '@app/helpers/poker-logic';
import { HUMAN_SEAT } from '@app/helpers/poker-seats';
import { PokerAction, PokerLegalActions, PokerState } from '@app/types/poker';
import { cn } from '@app/utils';

type PokerControlsProps = {
  state: PokerState;
  legal: PokerLegalActions | null;
  onAction: (action: PokerAction) => void;
  onNextHand: () => void;
};

const BUTTON =
  'flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40';
const PRIMARY = 'bg-pink hover:opacity-90';
const OUTLINE = 'border-2 border-gray-200 hover:border-pink';

function names(state: PokerState, seats: number[]): string {
  const list = seats.map((seat) => state.players[seat].name);
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}`;
}

function getStatus(state: PokerState): { text: string; highlight: boolean } {
  const human = state.players[HUMAN_SEAT];

  switch (state.phase) {
    case 'betting':
      if (state.turn === HUMAN_SEAT) {
        return { text: 'Sua vez.', highlight: true };
      }
      if (human.folded) {
        return {
          text: `Você está fora desta mão. ${state.players[state.turn].name} está pensando…`,
          highlight: false,
        };
      }
      return {
        text: `${state.players[state.turn].name} está pensando…`,
        highlight: false,
      };
    case 'street-end':
      return {
        text: state.reveal ? 'Ninguém mais aposta: abrindo a mesa…' : '',
        highlight: false,
      };
    case 'hand-end':
    case 'game-over': {
      if (!state.result) return { text: '', highlight: false };

      const humanWon = state.result.pots.some((pot) =>
        pot.winners.includes(HUMAN_SEAT),
      );
      const text = state.result.pots
        .map((pot, index) => {
          const who = names(state, pot.winners);
          const verb = pot.winners.length > 1 ? 'dividiram' : 'levou';
          const subject =
            pot.winners.length === 1 && pot.winners[0] === HUMAN_SEAT
              ? 'Você'
              : who;
          const potName =
            state.result && state.result.pots.length > 1
              ? ` (${index === 0 ? 'pote principal' : `pote lateral ${index}`})`
              : '';
          const hand = pot.hand ? ` com ${pot.hand.name}` : '';

          return `${subject} ${verb} ${formatChips(pot.amount)}${potName}${hand}.`;
        })
        .join(' ');

      return { text, highlight: humanWon };
    }
    default:
      return { text: '', highlight: false };
  }
}

export function PokerControls({
  state,
  legal,
  onAction,
  onNextHand,
}: PokerControlsProps) {
  const [raiseTo, setRaiseTo] = useState(0);
  const minRaiseTo = legal?.minRaiseTo ?? 0;

  useEffect(() => {
    setRaiseTo(minRaiseTo);
  }, [minRaiseTo, state.street, state.handNumber]);

  const { text, highlight } = getStatus(state);
  const status = (
    <p
      role="status"
      className={cn(
        'flex min-h-[44px] w-full items-center justify-center rounded-xl px-3 text-center font-semibold',
        highlight ? 'text-pink' : 'text-gray-100',
      )}
    >
      {text}
    </p>
  );

  if (state.phase === 'hand-end') {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        {status}
        <button
          type="button"
          onClick={onNextHand}
          className={cn(BUTTON, OUTLINE)}
        >
          <FastForward className="h-4 w-4" />
          Próxima mão
        </button>
      </div>
    );
  }

  if (!legal) return status;

  const pot = getPot(state);
  const clamp = (value: number) =>
    Math.max(legal.minRaiseTo, Math.min(Math.round(value), legal.maxRaiseTo));
  const presets = [
    { label: '½ pote', to: clamp(state.currentBet + (pot + legal.toCall) / 2) },
    { label: 'Pote', to: clamp(state.currentBet + pot + legal.toCall) },
    { label: 'All-in', to: legal.maxRaiseTo },
  ];
  const allIn = raiseTo >= legal.maxRaiseTo;
  let raiseLabel = state.currentBet === 0 ? 'Apostar' : 'Aumentar para';
  if (allIn) raiseLabel = 'All-in';

  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-pink bg-blue-100 p-3">
      <p className="text-center text-white">
        <b className="text-pink">Sua vez.</b>{' '}
        {legal.canCheck
          ? 'Ninguém apostou: dá para dar mesa.'
          : `Para continuar, pague ${formatChips(legal.toCall)}.`}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onAction({ type: 'fold' })}
          disabled={legal.canCheck}
          className={cn(BUTTON, OUTLINE)}
        >
          <Flag className="h-4 w-4" />
          Fold
        </button>
        <button
          type="button"
          onClick={() => onAction({ type: legal.canCheck ? 'check' : 'call' })}
          className={cn(BUTTON, PRIMARY)}
        >
          {legal.canCheck ? (
            <>
              <Check className="h-4 w-4" />
              Mesa
            </>
          ) : (
            <>
              <PhoneCall className="h-4 w-4" />
              {legal.toCall >= state.players[HUMAN_SEAT].chips
                ? `Pagar all-in ${formatChips(legal.toCall)}`
                : `Pagar ${formatChips(legal.toCall)}`}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onAction({ type: 'raise', to: raiseTo })}
          disabled={!legal.canRaise}
          className={cn(BUTTON, PRIMARY)}
        >
          <ArrowUp className="h-4 w-4" />
          {raiseLabel} {formatChips(raiseTo)}
        </button>
      </div>

      {legal.canRaise && legal.maxRaiseTo > legal.minRaiseTo && (
        <div className="flex w-full max-w-md flex-col gap-2">
          <input
            type="range"
            aria-label="Valor do aumento"
            min={legal.minRaiseTo}
            max={legal.maxRaiseTo}
            value={raiseTo}
            onChange={(event) => {
              const value = Number(event.target.value);
              const step = state.smallBlind;
              setRaiseTo(
                value >= legal.maxRaiseTo
                  ? legal.maxRaiseTo
                  : clamp(Math.round(value / step) * step),
              );
            }}
            className="w-full accent-pink"
          />
          <div className="flex justify-center gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setRaiseTo(preset.to)}
                className={cn(
                  'rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors',
                  raiseTo === preset.to
                    ? 'border-pink bg-pink/20 text-white'
                    : 'border-gray-200 text-gray-100 hover:border-pink',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
