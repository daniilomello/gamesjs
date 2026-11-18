import { AnimatePresence, motion } from 'motion/react';

import {
  getManilhaRank,
  isBlindHand,
  isManilha,
} from '@app/helpers/truco-logic';
import {
  cardName,
  seatName,
  SeatPosition,
  seatPosition,
} from '@app/helpers/truco-seats';
import { HUMAN_SEAT, HUMAN_TEAM } from '@app/hooks/use-truco';
import { TrucoState } from '@app/types/truco';
import { cn } from '@app/utils';

import { PlayingCard } from './PlayingCard';

type TrucoTableProps = {
  state: TrucoState;
  /** Hack: show the partner's cards. */
  peekPartner: boolean;
  /** Hack: show every card on the table. */
  peekAll: boolean;
};

const SEAT_CLASSES: Record<SeatPosition, string> = {
  bottom: '',
  top: 'left-1/2 top-2 -translate-x-1/2',
  left: 'left-2 top-[58%] -translate-y-1/2',
  right: 'right-2 top-[58%] -translate-y-1/2',
};

const SLOT_CLASSES: Record<SeatPosition, string> = {
  bottom: 'bottom-0 left-1/2 -translate-x-1/2',
  top: 'left-1/2 top-0 -translate-x-1/2',
  left: 'left-0 top-1/2 -translate-y-1/2',
  right: 'right-0 top-1/2 -translate-y-1/2',
};

const SLOT_ENTRANCE: Record<SeatPosition, { x: number; y: number }> = {
  bottom: { x: 0, y: 70 },
  top: { x: 0, y: -70 },
  left: { x: -70, y: 0 },
  right: { x: 70, y: 0 },
};

const BUBBLE_CLASSES: Record<SeatPosition, string> = {
  bottom: 'bottom-3 left-1/2 -translate-x-1/2',
  top: 'left-1/2 top-[84px] -translate-x-1/2',
  left: 'left-3 top-[58%] translate-y-10',
  right: 'right-3 top-[58%] translate-y-10',
};

const FIXED_MANILHA_LABELS = [
  { text: '4♣', red: false },
  { text: '7♥', red: true },
  { text: 'A♠', red: false },
  { text: '7♦', red: true },
];

export function TrucoTable({ state, peekPartner, peekAll }: TrucoTableProps) {
  const { players, variantId, vira } = state;
  const manilhaRank = getManilhaRank(variantId, vira);
  const blind = isBlindHand(state) && !peekAll;
  const showPartnerCards =
    peekPartner ||
    (state.mode === 'decisive' && state.decisionTeam === HUMAN_TEAM);
  const otherSeats = state.hands
    .map((_, seat) => seat)
    .filter((seat) => seat !== HUMAN_SEAT);

  return (
    <div className="relative h-[330px] w-full rounded-[2.5rem] border-[6px] border-blue-100 bg-gradient-to-b from-emerald-700 to-emerald-950 shadow-inner sm:h-[350px]">
      <div className="absolute left-4 top-3 flex flex-col items-center gap-1">
        {vira ? (
          <>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
              Vira
            </span>
            <PlayingCard card={vira} label={`Vira: ${cardName(vira)}`} />
            <span className="text-xs text-emerald-100">
              Manilha <b className="text-amber-300">{manilhaRank}</b>
            </span>
          </>
        ) : (
          <div className="rounded-lg bg-black/25 px-2 py-1 text-center">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
              Manilhas
            </span>
            <span className="flex gap-1 text-sm font-bold">
              {FIXED_MANILHA_LABELS.map(({ text, red }) => (
                <span
                  key={text}
                  className={red ? 'text-rose-400' : 'text-white'}
                >
                  {text}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      {otherSeats.map((seat) => {
        const position = seatPosition(seat, players);
        const isTurn = state.phase === 'playing' && state.turn === seat;
        const revealed =
          peekAll || (showPartnerCards && seat % 2 === HUMAN_TEAM);

        return (
          <div
            key={seat}
            className={cn(
              'absolute flex flex-col items-center gap-1',
              SEAT_CLASSES[position],
            )}
          >
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                isTurn ? 'bg-pink text-white' : 'bg-black/30 text-emerald-50',
              )}
            >
              {seatName(seat, players)}
            </span>
            <div className={cn('flex h-12', revealed ? 'gap-1' : '-space-x-4')}>
              {state.hands[seat].map((card) => (
                <PlayingCard
                  key={card.id}
                  size="sm"
                  card={revealed ? card : undefined}
                  manilha={revealed && isManilha(card, variantId, vira)}
                  label={revealed ? cardName(card) : 'Carta virada'}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="absolute left-1/2 top-1/2 h-[170px] w-[184px] -translate-x-1/2 -translate-y-1/2">
        {state.trick.map((play) => {
          const position = seatPosition(play.seat, players);
          const name = seatName(play.seat, players);

          return (
            <div
              key={play.card.id}
              className={cn('absolute', SLOT_CLASSES[position])}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.7, ...SLOT_ENTRANCE[position] }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <PlayingCard
                  card={play.card}
                  faceDown={play.faceDown}
                  manilha={!blind && isManilha(play.card, variantId, vira)}
                  winner={state.trickWinner === play.seat}
                  dimmed={
                    state.trickWinner !== null &&
                    state.trickWinner !== play.seat
                  }
                  label={
                    play.faceDown
                      ? `${name}: carta coberta`
                      : `${name}: ${cardName(play.card)}`
                  }
                />
              </motion.div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {state.speech && (
          <div
            key={`${state.speech.seat}-${state.speech.text}`}
            className={cn(
              'absolute z-10',
              BUBBLE_CLASSES[seatPosition(state.speech.seat, players)],
            )}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', duration: 0.35 }}
              role="status"
              className="whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-sm font-extrabold uppercase text-pink shadow-lg"
            >
              {seatName(state.speech.seat, players)}: {state.speech.text}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
