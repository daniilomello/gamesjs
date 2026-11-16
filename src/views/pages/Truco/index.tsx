import { ArrowLeft, EyeOff, Megaphone, Spade } from 'lucide-react';
import { motion } from 'motion/react';

import { ANIMATIONS } from '@app/constants';
import { isBlindHand, isManilha, stakeCall } from '@app/helpers/truco-logic';
import { cardName } from '@app/helpers/truco-seats';
import { TRUCO_VARIANTS } from '@app/helpers/truco-variants';
import { HUMAN_SEAT, useTruco } from '@app/hooks/use-truco';
import { cn } from '@app/utils';
import { Sidebar } from '@views/components/Sidebar';
import { PlayingCard } from '@views/components/truco/PlayingCard';
import { TrucoGameOver } from '@views/components/truco/TrucoGameOver';
import { TrucoPrompt } from '@views/components/truco/TrucoPrompt';
import { TrucoScoreBoard } from '@views/components/truco/TrucoScoreBoard';
import { TrucoSetup } from '@views/components/truco/TrucoSetup';
import { TrucoTable } from '@views/components/truco/TrucoTable';

export function Truco() {
  const {
    state,
    faceDown,
    isHumanTurn,
    canCallTruco,
    canPlayFaceDown,
    startGame,
    restartGame,
    quitGame,
    onPlayCard,
    onCallTruco,
    onRespond,
    onDecide,
    onToggleFaceDown,
  } = useTruco();

  const variant = state ? TRUCO_VARIANTS[state.variantId] : null;
  const blind = !!state && isBlindHand(state);

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex min-h-screen flex-1 items-center justify-center bg-blue-200 p-4">
        <div className="w-full max-w-3xl">
          <motion.div
            {...ANIMATIONS.fadeInDown}
            className="mb-4 flex items-center justify-center gap-2"
          >
            <Spade className="text-pink md:h-8 md:w-8" />
            <h1 className="text-md font-bold text-white sm:text-4xl">Truco</h1>
          </motion.div>

          {!state || !variant ? (
            <TrucoSetup onStart={startGame} />
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3">
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm text-gray-100">
                  <b className="text-white">{variant.name}</b> ·{' '}
                  {state.players === 4 ? 'duplas' : 'mano a mano'} · mão{' '}
                  {state.handNumber}
                </span>
                <button
                  type="button"
                  onClick={quitGame}
                  className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm text-white hover:text-pink"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Trocar modalidade
                </button>
              </div>

              <TrucoScoreBoard state={state} />
              <TrucoTable state={state} />
              <TrucoPrompt
                state={state}
                onRespond={onRespond}
                onDecide={onDecide}
              />

              <div className="flex min-h-[96px] items-end justify-center gap-2 xs:min-h-[112px] xs:gap-3">
                {state.hands[HUMAN_SEAT].map((card) => (
                  <PlayingCard
                    key={card.id}
                    size="lg"
                    card={card}
                    faceDown={blind}
                    manilha={isManilha(card, state.variantId, state.vira)}
                    dimmed={faceDown}
                    disabled={!isHumanTurn}
                    onClick={() => onPlayCard(card.id)}
                    label={blind ? 'Carta virada' : `Jogar ${cardName(card)}`}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onCallTruco}
                  disabled={!canCallTruco}
                  className="flex items-center gap-2 rounded-lg bg-pink px-5 py-2 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Megaphone className="h-4 w-4" />
                  Pedir {stakeCall(state.stakeIndex + 1) || 'Truco'}
                </button>
                <button
                  type="button"
                  onClick={onToggleFaceDown}
                  disabled={!canPlayFaceDown}
                  aria-pressed={faceDown}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 px-5 py-2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    faceDown
                      ? 'border-pink bg-pink/20'
                      : 'border-gray-200 hover:border-pink',
                  )}
                >
                  <EyeOff className="h-4 w-4" />
                  Jogar coberta
                </button>
              </div>

              <details className="w-full rounded-xl bg-blue-100 px-4 py-3 text-sm text-gray-100">
                <summary className="cursor-pointer font-semibold text-white">
                  Regras do {variant.name}
                </summary>
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
                  {variant.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                  <li>
                    Cada mão tem até 3 rodadas: leva quem ganhar 2. Se a
                    primeira empatar, quem ganhar a seguinte leva a mão.
                  </li>
                  <li>
                    A partir da segunda rodada dá para jogar uma carta coberta:
                    ela não vale nada e esconde o seu jogo.
                  </li>
                  <li>Ganha a partida quem fizer {variant.target} pontos.</li>
                </ul>
              </details>

              <TrucoGameOver
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
