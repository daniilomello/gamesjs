import { canRaisePending, stakeCall } from '@app/helpers/truco-logic';
import { seatName } from '@app/helpers/truco-seats';
import { TRUCO_VARIANTS } from '@app/helpers/truco-variants';
import { HUMAN_SEAT, HUMAN_TEAM } from '@app/hooks/use-truco';
import { TrucoResponse, TrucoState } from '@app/types/truco';
import { cn } from '@app/utils';

type TrucoPromptProps = {
  state: TrucoState;
  onRespond: (response: TrucoResponse) => void;
  onDecide: (play: boolean) => void;
};

const BUTTON = 'rounded-lg px-4 py-2 text-sm font-semibold transition-opacity';
const PRIMARY = 'bg-pink text-white hover:opacity-90';
const SECONDARY = 'bg-gray-200 text-white hover:opacity-90';

function getStatus(state: TrucoState): { text: string; highlight: boolean } {
  const { players, handResult } = state;
  const variant = TRUCO_VARIANTS[state.variantId];

  switch (state.phase) {
    case 'decision':
      return {
        text: `${variant.decisiveName} deles: estão decidindo se jogam…`,
        highlight: false,
      };
    case 'response':
      return { text: 'Aguardando a resposta deles…', highlight: false };
    case 'playing': {
      if (state.turn !== HUMAN_SEAT) {
        return {
          text: `${seatName(state.turn, players)} está jogando…`,
          highlight: false,
        };
      }
      if (state.mode === 'iron' && variant.blindIronHand) {
        return {
          text: 'Mão de ferro: escolha uma carta sem ver.',
          highlight: true,
        };
      }
      return { text: 'Sua vez: escolha uma carta.', highlight: true };
    }
    case 'round-end': {
      if (state.trickWinner === null) {
        return { text: 'Rodada empatada.', highlight: false };
      }
      const name = seatName(state.trickWinner, players);
      return {
        text:
          state.trickWinner === HUMAN_SEAT
            ? 'Você levou a rodada.'
            : `${name} levou a rodada.`,
        highlight: false,
      };
    }
    case 'hand-end':
    case 'game-over': {
      if (!handResult || handResult.winner === null) {
        return {
          text: 'Mão empatada: ninguém pontua.',
          highlight: false,
        };
      }
      const won = handResult.winner === HUMAN_TEAM;
      const gave = handResult.reason === 'run' || handResult.reason === 'fold';
      const points = `+${handResult.points}`;
      let text = won
        ? `Vocês ganharam a mão: ${points}.`
        : `Eles ganharam a mão: ${points}.`;

      if (gave) {
        text = won
          ? `Eles correram: ${points} para vocês.`
          : `Vocês correram: ${points} para eles.`;
      }

      return { text, highlight: won };
    }
    default:
      return { text: '', highlight: false };
  }
}

export function TrucoPrompt({ state, onRespond, onDecide }: TrucoPromptProps) {
  const variant = TRUCO_VARIANTS[state.variantId];
  const { pending } = state;

  if (state.phase === 'response' && pending && pending.team !== HUMAN_TEAM) {
    const call = stakeCall(pending.stakeIndex);

    return (
      <div
        role="alertdialog"
        aria-label={`Pediram ${call}`}
        className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-pink bg-blue-100 p-3 text-center"
      >
        <p className="text-white">
          <b>{seatName(pending.seat, state.players)}</b> pediu{' '}
          <b className="text-pink">{call}</b>. Aceitando, a mão vale{' '}
          <b>{variant.stakes[pending.stakeIndex]}</b>; correndo, eles levam{' '}
          <b>{variant.stakes[state.stakeIndex]}</b>.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className={cn(BUTTON, PRIMARY)}
            onClick={() => onRespond('accept')}
          >
            Aceitar
          </button>
          {canRaisePending(state) && (
            <button
              type="button"
              className={cn(BUTTON, PRIMARY)}
              onClick={() => onRespond('raise')}
            >
              Pedir {stakeCall(pending.stakeIndex + 1)}
            </button>
          )}
          <button
            type="button"
            className={cn(BUTTON, SECONDARY)}
            onClick={() => onRespond('run')}
          >
            Correr
          </button>
        </div>
      </div>
    );
  }

  if (state.phase === 'decision' && state.decisionTeam === HUMAN_TEAM) {
    return (
      <div
        role="alertdialog"
        aria-label={variant.decisiveName}
        className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-pink bg-blue-100 p-3 text-center"
      >
        <p className="text-white">
          <b className="text-pink">{variant.decisiveName}</b>: olhe as cartas
          {state.players === 4 && ' (as do parceiro estão abertas na mesa)'} e
          decida. Não vale pedir truco.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className={cn(BUTTON, PRIMARY)}
            onClick={() => onDecide(true)}
          >
            Jogar (vale {variant.decisiveValue})
          </button>
          <button
            type="button"
            className={cn(BUTTON, SECONDARY)}
            onClick={() => onDecide(false)}
          >
            Correr (+{variant.stakes[0]} para eles)
          </button>
        </div>
      </div>
    );
  }

  const { text, highlight } = getStatus(state);

  return (
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
}
