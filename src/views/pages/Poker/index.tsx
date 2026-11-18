import { ArrowLeft, Club, DoorOpen } from 'lucide-react';
import { motion } from 'motion/react';

import { ANIMATIONS } from '@app/constants';
import {
  cardName,
  formatChips,
  HAND_CATEGORIES,
  POKER_MODES,
  rankHand,
} from '@app/helpers/poker-cards';
import { handsToNextLevel } from '@app/helpers/poker-logic';
import { HUMAN_SEAT } from '@app/helpers/poker-seats';
import { usePoker } from '@app/hooks/use-poker';
import { PokerCard } from '@views/components/poker/PokerCard';
import { PokerControls } from '@views/components/poker/PokerControls';
import { PokerGameOver } from '@views/components/poker/PokerGameOver';
import { PokerSetup } from '@views/components/poker/PokerSetup';
import {
  PokerTable,
  winningCards,
  winningSeats,
} from '@views/components/poker/PokerTable';
import { Sidebar } from '@views/components/Sidebar';

export function Poker() {
  const {
    state,
    peekAll,
    legal,
    startGame,
    restartGame,
    quitGame,
    onAction,
    onNextHand,
    onLeaveTable,
  } = usePoker();

  const mode = state ? POKER_MODES[state.modeId] : null;
  const human = state?.players[HUMAN_SEAT];
  const hasCards = !!human && human.hand.length > 0;
  const madeHand =
    state && human && hasCards && state.board.length >= 3
      ? rankHand([...human.hand, ...state.board])
      : null;
  const nextLevel = state ? handsToNextLevel(state) : null;
  const highlighted = state ? winningCards(state) : new Set<string>();
  const humanWon = !!state && winningSeats(state).has(HUMAN_SEAT);

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex min-h-screen flex-1 items-center justify-center bg-blue-200 p-4">
        <div className="w-full max-w-3xl">
          <motion.div
            {...ANIMATIONS.fadeInDown}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <Club className="text-pink md:h-8 md:w-8" />
            <h1 className="text-md font-bold text-white sm:text-4xl">
              Texas Hold&apos;em
            </h1>
          </motion.div>

          {!state || !mode || !human ? (
            <PokerSetup onStart={startGame} />
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3">
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm text-gray-100">
                  <b className="text-white">{mode.name}</b> · mão{' '}
                  {state.handNumber}
                </span>
                <div className="flex shrink-0 gap-3">
                  {mode.rebuy && state.phase !== 'game-over' && (
                    <button
                      type="button"
                      onClick={onLeaveTable}
                      className="flex items-center gap-1 whitespace-nowrap text-sm text-white hover:text-pink"
                    >
                      <DoorOpen className="h-4 w-4" />
                      Levantar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={quitGame}
                    className="flex items-center gap-1 whitespace-nowrap text-sm text-white hover:text-pink"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Trocar modalidade
                  </button>
                </div>
              </div>

              <div className="flex w-full items-center rounded-xl bg-blue-100 px-4 py-3">
                <div className="flex flex-1 flex-col items-center">
                  <span className="text-xs uppercase tracking-wide text-gray-100">
                    Suas fichas
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {formatChips(human.chips)}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="rounded-full bg-pink px-3 py-1 text-sm font-semibold text-white">
                    Blinds {state.smallBlind}/{state.bigBlind}
                  </span>
                  <span className="text-xs text-gray-100">
                    {nextLevel !== null
                      ? `sobem em ${nextLevel} ${nextLevel === 1 ? 'mão' : 'mãos'}`
                      : 'fixos'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <span className="text-xs uppercase tracking-wide text-gray-100">
                    {mode.rebuy ? 'Resultado' : 'Na mesa'}
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {mode.rebuy
                      ? `${human.chips >= mode.startingStack ? '+' : '−'}${formatChips(Math.abs(human.chips - mode.startingStack))}`
                      : state.players.filter((player) => player.chips > 0)
                          .length}
                  </span>
                </div>
              </div>

              <PokerTable state={state} peekAll={peekAll} />

              <div className="flex min-h-[96px] flex-col items-center gap-1 xs:min-h-[112px]">
                <div className="flex items-end justify-center gap-2 xs:gap-3">
                  {human.hand.map((card) => (
                    <PokerCard
                      key={card.id}
                      size="lg"
                      card={card}
                      label={cardName(card)}
                      highlight={humanWon && highlighted.has(card.id)}
                      dimmed={human.folded}
                    />
                  ))}
                </div>
                {madeHand && !human.folded && (
                  <span className="text-sm font-semibold text-amber-300">
                    {madeHand.name}
                  </span>
                )}
              </div>

              <PokerControls
                state={state}
                legal={legal}
                onAction={onAction}
                onNextHand={onNextHand}
              />

              <details className="w-full rounded-xl bg-blue-100 px-4 py-3 text-sm text-gray-100">
                <summary className="cursor-pointer font-semibold text-white">
                  Regras do Texas Hold&apos;em
                </summary>
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
                  {mode.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                  <li>
                    Cada jogador recebe 2 cartas fechadas. Na mesa abrem 5
                    cartas comunitárias: o flop (3), o turn (1) e o river (1).
                  </li>
                  <li>
                    Há uma rodada de apostas antes do flop e depois de cada
                    carta aberta. Dá para dar mesa, pagar, aumentar ou largar
                    (fold).
                  </li>
                  <li>
                    Vale o melhor jogo de 5 cartas entre as suas 2 e as 5 da
                    mesa. Do mais fraco ao mais forte:{' '}
                    {HAND_CATEGORIES.join(', ')}.
                  </li>
                  <li>
                    Quem vai all-in só disputa o que conseguiu cobrir; o resto
                    vira pote lateral entre os outros.
                  </li>
                </ul>
              </details>

              <PokerGameOver
                state={state}
                onRestart={restartGame}
                onQuit={quitGame}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
