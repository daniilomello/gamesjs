import {
  TrucoBotAction,
  TrucoCard,
  TrucoResponse,
  TrucoState,
  TrucoTeam,
} from '@app/types/truco';

import {
  canCallTruco,
  canRaisePending,
  cardStrength,
  isBlindHand,
  isManilha,
  otherTeam,
  seatsOfTeam,
  teamOf,
  trickStanding,
} from './truco-logic';
import { TRUCO_VARIANTS } from './truco-variants';

type Random = () => number;

/**
 * How much a card is worth when judging a hand: only the top of the deck
 * counts, relative to the ranks that are actually in play.
 */
function cardWeight(state: TrucoState, card: TrucoCard): number {
  const strength = cardStrength(card, state.variantId, state.vira);
  if (strength >= 100) return 1 + (strength - 100) * 0.15;

  const { ranks } = TRUCO_VARIANTS[state.variantId];
  const position = ranks.indexOf(card.rank) / (ranks.length - 1);

  return Math.max(0, 0.2 + (position - 2 / 3) * 1.65);
}

function sortedHand(state: TrucoState, seat: number): TrucoCard[] {
  const strength = (card: TrucoCard) =>
    cardStrength(card, state.variantId, state.vira);

  return [...state.hands[seat]].sort((a, b) => strength(a) - strength(b));
}

/** Cards still in hand plus the card on the table if it is currently winning. */
function seatScore(state: TrucoState, seat: number): number {
  const inHand = state.hands[seat].reduce(
    (sum, card) => sum + cardWeight(state, card),
    0,
  );
  const winning =
    trickStanding(state)?.seat === seat &&
    state.trick.find((play) => play.seat === seat && !play.faceDown);

  return inHand + (winning ? cardWeight(state, winning.card) * 0.8 : 0);
}

function roundsOutlook(state: TrucoState, team: TrucoTeam): number {
  return state.rounds.reduce<number>((sum, round) => {
    if (round === team) return sum + 0.9;
    if (round === 'tie') return sum;
    return sum - 0.4;
  }, 0);
}

function teamScore(state: TrucoState, team: TrucoTeam): number {
  const [best = 0, second = 0] = seatsOfTeam(state, team)
    .map((seat) => seatScore(state, seat))
    .sort((a, b) => b - a);

  return best + second * 0.35 + roundsOutlook(state, team);
}

function chooseCard(state: TrucoState, seat: number, random: Random): string {
  const hand = sortedHand(state, seat);
  const lowest = hand[0];
  const highest = hand[hand.length - 1];

  if (isBlindHand(state)) {
    return hand[Math.floor(random() * hand.length)].id;
  }

  const standing = trickStanding(state);
  const strength = (card: TrucoCard) =>
    cardStrength(card, state.variantId, state.vira);

  if (!standing) {
    // Leading the first round with a manilha in hand: keep it for later.
    const keepManilha =
      state.rounds.length === 0 && hand.length > 1 && strength(highest) >= 100;

    return (keepManilha ? hand[hand.length - 2] : highest).id;
  }

  const isLast = state.trick.length === state.players - 1;
  const partnerAhead = standing.team === teamOf(seat);

  if (partnerAhead && (isLast || standing.strength >= 8)) return lowest.id;

  // First round tied on the table: holding a manilha, let it stay tied and
  // keep the manilha for the second round, which then decides the hand.
  if (
    standing.team === 'tie' &&
    state.rounds.length === 0 &&
    hand.some((card) => isManilha(card, state.variantId, state.vira))
  ) {
    const keepsTie = hand.find((card) => strength(card) <= standing.strength);
    return (keepsTie ?? lowest).id;
  }

  if (!partnerAhead) {
    const winning = hand.find((card) => strength(card) > standing.strength);
    if (winning) return winning.id;

    const tying = hand.find((card) => strength(card) === standing.strength);
    if (tying) return tying.id;
  }

  return lowest.id;
}

export function chooseBotAction(
  state: TrucoState,
  seat: number,
  random: Random = Math.random,
): TrucoBotAction {
  if (canCallTruco(state, seat)) {
    const team = teamOf(seat);
    const manilhas = state.hands[seat].filter((card) =>
      isManilha(card, state.variantId, state.vira),
    ).length;
    const teamManilhaOnTable = state.trick.some(
      (play) =>
        teamOf(play.seat) === team &&
        !play.faceDown &&
        isManilha(play.card, state.variantId, state.vira),
    );

    // Won the first round and holds a manilha for the second: always truco.
    if (
      state.rounds.length === 1 &&
      state.rounds[0] === team &&
      (manilhas > 0 || teamManilhaOnTable)
    ) {
      return { type: 'truco' };
    }

    // Two manilhas in the first round: stay quiet and let the others bet.
    if (state.rounds.length === 0 && manilhas >= 2) {
      return { type: 'play', cardId: chooseCard(state, seat, random) };
    }

    const score = seatScore(state, seat) + roundsOutlook(state, team);
    let chance = 0.04;

    if (score >= 1.9) chance = 0.75;
    else if (score >= 1.35) chance = 0.3;

    if (state.rounds.length === 0) chance *= 0.6;
    // The human's partner leaves most of the betting to the human.
    if (team === 0) chance *= 0.5;

    if (random() < chance) return { type: 'truco' };
  }

  return { type: 'play', cardId: chooseCard(state, seat, random) };
}

export function chooseBotResponse(
  state: TrucoState,
  random: Random = Math.random,
): TrucoResponse {
  const { pending } = state;
  if (!pending) return 'accept';

  const { stakes, target } = TRUCO_VARIANTS[state.variantId];
  const team = otherTeam(pending.team);
  const score = teamScore(state, team) + (random() - 0.5) * 0.5;
  const acceptAt = 0.85 + 0.3 * (pending.stakeIndex - 1);
  const raiseAt = acceptAt + 0.95;
  // Running would hand the game to the other team anyway.
  const nothingToLose =
    state.scores[pending.team] + stakes[state.stakeIndex] >= target;

  if (canRaisePending(state) && score >= raiseAt) return 'raise';
  if (score >= acceptAt || nothingToLose || random() < 0.08) return 'accept';
  return 'run';
}

/** Whether a bot team one hand away from winning plays the hand. */
export function chooseBotDecision(
  state: TrucoState,
  random: Random = Math.random,
): boolean {
  if (state.decisionTeam === null) return true;

  return teamScore(state, state.decisionTeam) >= 0.7 || random() < 0.15;
}
