import {
  TrucoCard,
  TrucoDeal,
  TrucoHandMode,
  TrucoHandResult,
  TrucoPlay,
  TrucoPlayerCount,
  TrucoRank,
  TrucoResponse,
  TrucoRoundResult,
  TrucoState,
  TrucoTeam,
  TrucoVariantId,
} from '@app/types/truco';

import {
  FIXED_MANILHAS,
  STAKE_CALLS,
  TRUCO_RANKS,
  TRUCO_SUITS,
  TRUCO_VARIANTS,
} from './truco-variants';

const MANILHA_BASE = 100;
const FACE_DOWN_STRENGTH = -1;

export function teamOf(seat: number): TrucoTeam {
  return (seat % 2) as TrucoTeam;
}

export function otherTeam(team: TrucoTeam): TrucoTeam {
  return team === 0 ? 1 : 0;
}

export function seatsOfTeam(state: TrucoState, team: TrucoTeam): number[] {
  return state.hands.map((_, seat) => seat).filter((s) => teamOf(s) === team);
}

export function createDeck(variantId: TrucoVariantId): TrucoCard[] {
  const { ranks, extraCards = [] } = TRUCO_VARIANTS[variantId];
  const deck = ranks.flatMap((rank) =>
    TRUCO_SUITS.map((suit) => ({ id: `${rank}-${suit}`, rank, suit })),
  );
  const extras = extraCards.filter(
    (card) => !deck.some((inDeck) => inDeck.id === card.id),
  );

  return [...deck, ...extras.map((card) => ({ ...card }))];
}

export function dealHand(
  variantId: TrucoVariantId,
  players: TrucoPlayerCount,
  random: () => number = Math.random,
): TrucoDeal {
  const deck = createDeck(variantId);

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const hands = Array.from({ length: players }, (_, seat) =>
    deck.slice(seat * 3, seat * 3 + 3),
  );
  const vira =
    TRUCO_VARIANTS[variantId].manilha === 'vira' ? deck[players * 3] : null;

  return { hands, vira };
}

export function getManilhaRank(
  variantId: TrucoVariantId,
  vira: TrucoCard | null,
): TrucoRank | null {
  const { ranks, manilha } = TRUCO_VARIANTS[variantId];
  if (manilha !== 'vira' || !vira) return null;

  return ranks[(ranks.indexOf(vira.rank) + 1) % ranks.length];
}

/** Normal cards score 0-9, manilhas 100-103. */
export function cardStrength(
  card: TrucoCard,
  variantId: TrucoVariantId,
  vira: TrucoCard | null,
): number {
  if (TRUCO_VARIANTS[variantId].manilha === 'fixed') {
    const fixed = FIXED_MANILHAS.indexOf(card.id);
    if (fixed >= 0) return MANILHA_BASE + fixed;
  } else if (card.rank === getManilhaRank(variantId, vira)) {
    return MANILHA_BASE + TRUCO_SUITS.indexOf(card.suit);
  }

  return TRUCO_RANKS.indexOf(card.rank);
}

export function isManilha(
  card: TrucoCard,
  variantId: TrucoVariantId,
  vira: TrucoCard | null,
): boolean {
  return cardStrength(card, variantId, vira) >= MANILHA_BASE;
}

export function playStrength(state: TrucoState, play: TrucoPlay): number {
  return play.faceDown
    ? FACE_DOWN_STRENGTH
    : cardStrength(play.card, state.variantId, state.vira);
}

/** Who is ahead in the trick on the table. */
export function trickStanding(state: TrucoState): {
  strength: number;
  team: TrucoRoundResult;
  seat: number | null;
  lastTop: number;
} | null {
  if (state.trick.length === 0) return null;

  const strengths = state.trick.map((play) => playStrength(state, play));
  const strength = Math.max(...strengths);
  const tops = state.trick.filter((_, i) => strengths[i] === strength);
  const teams = new Set(tops.map((play) => teamOf(play.seat)));
  const lastTop = tops[tops.length - 1].seat;

  if (teams.size > 1) return { strength, team: 'tie', seat: null, lastTop };

  return { strength, team: teamOf(tops[0].seat), seat: tops[0].seat, lastTop };
}

/**
 * Best of three. A tied round is decided by the next one; if the hand is split
 * and a later round ties, whoever won the first round takes it.
 */
export function getHandWinner(
  rounds: TrucoRoundResult[],
): TrucoTeam | 'draw' | null {
  const [first, second, third] = rounds;

  if (rounds.length >= 2) {
    if (first === 'tie' && second !== 'tie') return second;
    if (first !== 'tie' && (second === 'tie' || second === first)) return first;
  }

  if (rounds.length >= 3) {
    if (third !== 'tie') return third;
    return first === 'tie' ? 'draw' : first;
  }

  return null;
}

function getHandMode(
  variantId: TrucoVariantId,
  scores: [number, number],
): { mode: TrucoHandMode; decisionTeam: TrucoTeam | null } {
  const { target, stakes } = TRUCO_VARIANTS[variantId];
  const decisive = target - stakes[0];
  const us = scores[0] >= decisive;
  const them = scores[1] >= decisive;

  if (us && them) return { mode: 'iron', decisionTeam: null };
  if (us || them) return { mode: 'decisive', decisionTeam: us ? 0 : 1 };
  return { mode: 'normal', decisionTeam: null };
}

function buildHand(
  base: Pick<TrucoState, 'variantId' | 'players' | 'scores'>,
  handNumber: number,
  starter: number,
  deal: TrucoDeal,
): TrucoState {
  const { mode, decisionTeam } = getHandMode(base.variantId, base.scores);

  return {
    variantId: base.variantId,
    players: base.players,
    scores: base.scores,
    handNumber,
    starter,
    hands: deal.hands,
    vira: deal.vira,
    turn: starter,
    trick: [],
    trickWinner: null,
    nextLeader: starter,
    rounds: [],
    stakeIndex: 0,
    raisedBy: null,
    pending: null,
    phase: mode === 'decisive' ? 'decision' : 'playing',
    mode,
    decisionTeam,
    handResult: null,
    speech: null,
    winner: null,
  };
}

export function createGame(
  variantId: TrucoVariantId,
  players: TrucoPlayerCount,
  deal: TrucoDeal,
): TrucoState {
  return buildHand({ variantId, players, scores: [0, 0] }, 1, 0, deal);
}

export function startHand(state: TrucoState, deal: TrucoDeal): TrucoState {
  if (state.phase !== 'hand-end') return state;

  return buildHand(
    state,
    state.handNumber + 1,
    (state.starter + 1) % state.players,
    deal,
  );
}

export function getHandValue(state: TrucoState): number {
  const variant = TRUCO_VARIANTS[state.variantId];

  if (state.mode === 'decisive') return variant.decisiveValue;
  if (state.mode === 'iron') return variant.stakes[0];
  return variant.stakes[state.stakeIndex];
}

/** Whether cards are hidden from their own holders in this hand. */
export function isBlindHand(state: TrucoState): boolean {
  return state.mode === 'iron' && TRUCO_VARIANTS[state.variantId].blindIronHand;
}

export function canCallTruco(state: TrucoState, seat: number): boolean {
  const { stakes } = TRUCO_VARIANTS[state.variantId];

  return (
    state.phase === 'playing' &&
    state.turn === seat &&
    state.mode === 'normal' &&
    state.stakeIndex < stakes.length - 1 &&
    state.raisedBy !== teamOf(seat)
  );
}

export function canRaisePending(state: TrucoState): boolean {
  const { stakes } = TRUCO_VARIANTS[state.variantId];

  return state.pending !== null && state.pending.stakeIndex < stakes.length - 1;
}

/** Face-down cards are only allowed from the second round on. */
export function canPlayFaceDown(state: TrucoState): boolean {
  return (
    state.phase === 'playing' && state.rounds.length > 0 && !isBlindHand(state)
  );
}

/** Name of the bet being asked when raising to `stakeIndex`. */
export function stakeCall(stakeIndex: number): string {
  return STAKE_CALLS[stakeIndex - 1] ?? '';
}

function endHand(
  state: TrucoState,
  winner: TrucoTeam | null,
  points: number,
  reason: TrucoHandResult['reason'],
): TrucoState {
  const { target } = TRUCO_VARIANTS[state.variantId];
  const scores: [number, number] = [...state.scores];

  if (winner !== null) {
    scores[winner] = Math.min(target, scores[winner] + points);
  }

  const gameOver = winner !== null && scores[winner] >= target;

  return {
    ...state,
    scores,
    pending: null,
    phase: gameOver ? 'game-over' : 'hand-end',
    handResult: { winner, points: winner === null ? 0 : points, reason },
    winner: gameOver ? winner : null,
  };
}

export function playCard(
  state: TrucoState,
  seat: number,
  cardId: string,
  faceDown = false,
): TrucoState {
  if (state.phase !== 'playing' || state.turn !== seat) return state;

  const card = state.hands[seat].find((c) => c.id === cardId);
  if (!card) return state;

  const hands = state.hands.map((hand, i) =>
    i === seat ? hand.filter((c) => c.id !== cardId) : hand,
  );
  const trick = [
    ...state.trick,
    { seat, card, faceDown: faceDown && canPlayFaceDown(state) },
  ];
  const next: TrucoState = { ...state, hands, trick, speech: null };

  if (trick.length < state.players) {
    return { ...next, turn: (seat + 1) % state.players };
  }

  const standing = trickStanding(next)!;

  return {
    ...next,
    rounds: [...state.rounds, standing.team],
    trickWinner: standing.seat,
    // Whoever wins leads the next round; on a tie, whoever tied it does.
    nextLeader: standing.seat ?? standing.lastTop,
    phase: 'round-end',
  };
}

export function finishRound(state: TrucoState): TrucoState {
  if (state.phase !== 'round-end') return state;

  const winner = getHandWinner(state.rounds);

  if (winner === null) {
    return {
      ...state,
      trick: [],
      trickWinner: null,
      turn: state.nextLeader,
      phase: 'playing',
    };
  }

  if (winner === 'draw') return endHand(state, null, 0, 'draw');
  return endHand(state, winner, getHandValue(state), 'rounds');
}

export function callTruco(state: TrucoState, seat: number): TrucoState {
  if (!canCallTruco(state, seat)) return state;

  const stakeIndex = state.stakeIndex + 1;

  return {
    ...state,
    phase: 'response',
    pending: { seat, team: teamOf(seat), stakeIndex },
    speech: { seat, text: `${stakeCall(stakeIndex)}!` },
  };
}

export function respondTruco(
  state: TrucoState,
  response: TrucoResponse,
  responderSeat?: number,
): TrucoState {
  const { pending } = state;
  if (state.phase !== 'response' || !pending) return state;

  const { stakes } = TRUCO_VARIANTS[state.variantId];
  const seat = responderSeat ?? (pending.seat + 1) % state.players;

  if (response === 'run') {
    return endHand(
      { ...state, speech: { seat, text: 'Tô fora!' } },
      pending.team,
      stakes[state.stakeIndex],
      'run',
    );
  }

  const accepted: TrucoState = {
    ...state,
    stakeIndex: pending.stakeIndex,
    raisedBy: pending.team,
  };

  if (response === 'raise' && canRaisePending(state)) {
    const stakeIndex = pending.stakeIndex + 1;

    return {
      ...accepted,
      pending: { seat, team: otherTeam(pending.team), stakeIndex },
      speech: { seat, text: `${stakeCall(stakeIndex)}!` },
    };
  }

  return {
    ...accepted,
    pending: null,
    phase: 'playing',
    speech: { seat, text: 'Desce!' },
  };
}

/** Giving up the hand on your turn: the other team takes what the hand is worth. */
export function canFold(state: TrucoState, seat: number): boolean {
  return state.phase === 'playing' && state.turn === seat;
}

export function foldHand(state: TrucoState, seat: number): TrucoState {
  if (!canFold(state, seat)) return state;

  return endHand(
    { ...state, speech: { seat, text: 'Tô fora!' } },
    otherTeam(teamOf(seat)),
    getHandValue(state),
    'fold',
  );
}

/** Decision of the team that is one hand away from winning: play or give up the hand. */
export function decideHand(state: TrucoState, play: boolean): TrucoState {
  if (state.phase !== 'decision' || state.decisionTeam === null) return state;

  const seat = seatsOfTeam(state, state.decisionTeam)[0];

  if (play) {
    return { ...state, phase: 'playing', speech: { seat, text: 'Vou jogar!' } };
  }

  return endHand(
    { ...state, speech: { seat, text: 'Tô fora!' } },
    otherTeam(state.decisionTeam),
    TRUCO_VARIANTS[state.variantId].stakes[0],
    'fold',
  );
}
