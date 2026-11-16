import { getHandValue } from '@app/helpers/truco-logic';
import { TRUCO_VARIANTS } from '@app/helpers/truco-variants';
import { HUMAN_TEAM } from '@app/hooks/use-truco';
import { TrucoRoundResult, TrucoState } from '@app/types/truco';
import { cn } from '@app/utils';

type TrucoScoreBoardProps = {
  state: TrucoState;
};

function roundLabel(round: TrucoRoundResult | undefined): string {
  if (round === undefined) return 'não jogada';
  if (round === 'tie') return 'empatada';
  return round === HUMAN_TEAM ? 'de vocês' : 'deles';
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="text-xs uppercase tracking-wide text-gray-100">
        {label}
      </span>
      <span className="text-3xl font-bold tabular-nums text-white">
        {value}
      </span>
    </div>
  );
}

export function TrucoScoreBoard({ state }: TrucoScoreBoardProps) {
  const variant = TRUCO_VARIANTS[state.variantId];
  const value = getHandValue(state);
  let handLabel = `Vale ${value}`;

  if (state.mode === 'decisive') {
    handLabel = `${variant.decisiveName} · vale ${value}`;
  } else if (state.mode === 'iron') {
    handLabel = variant.blindIronHand ? 'Mão de ferro' : 'Mão decisiva';
  }

  return (
    <div className="flex w-full items-center rounded-xl bg-blue-100 px-4 py-3">
      <Score label="Nós" value={state.scores[0]} />

      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-pink px-3 py-1 text-sm font-semibold text-white">
          {handLabel}
        </span>
        <div className="flex gap-2">
          {[0, 1, 2].map((index) => {
            const round = state.rounds[index];

            return (
              <span
                key={index}
                role="img"
                aria-label={`Rodada ${index + 1}: ${roundLabel(round)}`}
                className={cn(
                  'h-3 w-3 rounded-full border border-gray-200',
                  round === HUMAN_TEAM && 'border-emerald-400 bg-emerald-400',
                  round === 1 && 'border-rose-500 bg-rose-500',
                  round === 'tie' && 'border-amber-400 bg-amber-400',
                )}
              />
            );
          })}
        </div>
      </div>

      <Score label="Eles" value={state.scores[1]} />
    </div>
  );
}
