import { motion } from 'motion/react';

import { cardName, formatChips } from '@app/helpers/poker-cards';
import { getPot } from '@app/helpers/poker-logic';
import { HUMAN_SEAT, seatSpot } from '@app/helpers/poker-seats';
import { PokerCard as PokerCardType, PokerState } from '@app/types/poker';
import { cn } from '@app/utils';

import { PokerCard } from './PokerCard';

type PokerTableProps = {
  state: PokerState;
  /** Hack: show every card on the table. */
  peekAll: boolean;
};

const CENTER: [number, number] = [50, 48];

function towardCenter([left, top]: [number, number], amount: number) {
  return {
    left: `${left + (CENTER[0] - left) * amount}%`,
    top: `${top + (CENTER[1] - top) * amount}%`,
  };
}

export function winningSeats(state: PokerState): Set<number> {
  return new Set(state.result?.pots.flatMap((pot) => pot.winners) ?? []);
}

export function winningCards(state: PokerState): Set<string> {
  const hand = state.result?.showdown ? state.result.pots[0]?.hand : null;
  return new Set(hand?.cards.map((card) => card.id) ?? []);
}

export function PokerTable({ state, peekAll }: PokerTableProps) {
  const count = state.players.length;
  const winners = winningSeats(state);
  const highlighted = winningCards(state);
  const handOver = state.phase === 'hand-end' || state.phase === 'game-over';
  const pot = getPot(state);
  const boardSlots: (PokerCardType | undefined)[] = Array.from(
    { length: 5 },
    (_, index) => state.board[index],
  );

  return (
    <div className="relative h-[430px] w-full rounded-[3rem] border-[6px] border-blue-100 bg-gradient-to-b from-emerald-700 to-emerald-950 shadow-inner sm:h-[440px] sm:rounded-[50%]">
      <div className="absolute left-1/2 top-[48%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
        <span className="rounded-full bg-black/30 px-3 py-0.5 text-sm font-semibold text-emerald-50">
          Pote <b className="tabular-nums text-amber-300">{formatChips(pot)}</b>
        </span>

        <div className="flex gap-1 sm:gap-1.5">
          {boardSlots.map((card, index) =>
            card ? (
              <motion.div
                // eslint-disable-next-line react/no-array-index-key
                key={`${state.handNumber}-${index}`}
                initial={{ opacity: 0, y: -20, rotateY: 90 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.3, delay: (index % 3) * 0.08 }}
              >
                <PokerCard
                  card={card}
                  label={cardName(card)}
                  highlight={highlighted.has(card.id)}
                  dimmed={highlighted.size > 0 && !highlighted.has(card.id)}
                />
              </motion.div>
            ) : (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="h-[4.2rem] w-12 rounded-lg border border-dashed border-emerald-300/30 sm:h-20 sm:w-14"
              />
            ),
          )}
        </div>
      </div>

      {state.players.map((player) => {
        const spot = seatSpot(player.seat, count);
        const isHuman = player.seat === HUMAN_SEAT;
        const isTurn = state.phase === 'betting' && state.turn === player.seat;
        const isWinner = handOver && winners.has(player.seat);
        const revealed =
          !player.folded &&
          (peekAll || (state.reveal && !player.out && player.hand.length > 0));
        const blind =
          (player.seat === state.smallBlindSeat && 'SB') ||
          (player.seat === state.bigBlindSeat && 'BB') ||
          null;

        return (
          <div key={player.seat}>
            {player.bet > 0 && (
              <div
                className="absolute z-[1] -translate-x-1/2 -translate-y-1/2"
                style={towardCenter(spot, 0.5)}
              >
                <motion.span
                  key={player.bet}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1 rounded-full bg-black/40 py-0.5 pl-0.5 pr-2 text-xs font-bold tabular-nums text-white"
                >
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-white bg-pink" />
                  {formatChips(player.bet)}
                </motion.span>
              </div>
            )}

            <div
              className={cn(
                'absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1',
                player.out && 'opacity-40',
              )}
              style={{ left: `${spot[0]}%`, top: `${spot[1]}%` }}
            >
              {!isHuman && !player.out && player.hand.length > 0 && (
                <div
                  className={cn(
                    'flex h-11',
                    revealed ? 'gap-0.5' : '-space-x-4',
                    player.folded && 'opacity-30',
                  )}
                >
                  {player.hand.map((card) => (
                    <PokerCard
                      key={card.id}
                      size="sm"
                      card={revealed ? card : undefined}
                      highlight={
                        revealed && isWinner && highlighted.has(card.id)
                      }
                      label={revealed ? cardName(card) : 'Carta virada'}
                    />
                  ))}
                </div>
              )}

              <div
                className={cn(
                  'relative min-w-[78px] rounded-lg px-2 py-1 text-center transition-colors',
                  isTurn ? 'bg-pink text-white' : 'bg-black/45 text-emerald-50',
                  isWinner && 'ring-2 ring-amber-400',
                )}
              >
                <span className="block whitespace-nowrap text-xs font-semibold">
                  {player.name}
                </span>
                <span className="block text-xs font-bold tabular-nums text-amber-300">
                  {player.out ? 'Eliminado' : formatChips(player.chips)}
                </span>

                {state.dealer === player.seat && !player.out && (
                  <span
                    title="Dealer"
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-slate-900 shadow"
                  >
                    D
                  </span>
                )}
                {blind && state.street === 'preflop' && !handOver && (
                  <span className="absolute -left-2 -top-2 rounded-full bg-amber-400 px-1 text-[9px] font-extrabold text-slate-900 shadow">
                    {blind}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  'h-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide',
                  isWinner ? 'text-amber-300' : 'text-emerald-100',
                )}
              >
                {isWinner ? 'Venceu' : player.lastAction}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
