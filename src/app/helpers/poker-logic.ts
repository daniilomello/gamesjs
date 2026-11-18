import {
  PokerAction,
  PokerHandRank,
  PokerLegalActions,
  PokerModeId,
  PokerPlayer,
  PokerPlayerCount,
  PokerPotResult,
  PokerState,
  PokerStreet,
} from '@app/types/poker';

import {
  createDeck,
  formatChips,
  POKER_MODES,
  rankHand,
  shuffle,
} from './poker-cards';
import { HUMAN_SEAT, SEAT_NAMES } from './poker-seats';

type Random = () => number;

const NEXT_STREET: Record<PokerStreet, PokerStreet | null> = {
  preflop: 'flop',
  flop: 'turn',
  turn: 'river',
  river: null,
};

const STREET_CARDS: Record<PokerStreet, number> = {
  preflop: 0,
  flop: 3,
  turn: 1,
  river: 1,
};

export function isInHand(player: PokerPlayer): boolean {
  return !player.out && !player.folded;
}

export function canAct(player: PokerPlayer): boolean {
  return isInHand(player) && !player.allIn;
}

/** Next seat clockwise (to the left) that matches the predicate. */
export function nextSeat(
  players: PokerPlayer[],
  from: number,
  predicate: (player: PokerPlayer) => boolean,
): number {
  for (let step = 1; step <= players.length; step += 1) {
    const seat = (from + step) % players.length;
    if (predicate(players[seat])) return seat;
  }

  return from;
}

export function getPot(state: PokerState): number {
  return state.players.reduce((sum, player) => sum + player.committed, 0);
}

function blindsFor(modeId: PokerModeId, handNumber: number) {
  const { blindLevels, handsPerLevel } = POKER_MODES[modeId];
  const level = handsPerLevel
    ? Math.min(
        Math.floor((handNumber - 1) / handsPerLevel),
        blindLevels.length - 1,
      )
    : 0;
  const [smallBlind, bigBlind] = blindLevels[level];

  return { level, smallBlind, bigBlind };
}

/** Hands left before the blinds go up, `null` when they never do. */
export function handsToNextLevel(state: PokerState): number | null {
  const { blindLevels, handsPerLevel } = POKER_MODES[state.modeId];
  if (!handsPerLevel || state.level >= blindLevels.length - 1) return null;

  return handsPerLevel * (state.level + 1) - state.handNumber + 1;
}

function postChips(player: PokerPlayer, amount: number): PokerPlayer {
  const paid = Math.min(amount, player.chips);
  const chips = player.chips - paid;

  return {
    ...player,
    chips,
    bet: player.bet + paid,
    committed: player.committed + paid,
    allIn: chips === 0,
  };
}

function awardUncontested(state: PokerState): PokerState {
  const pot = getPot(state);
  const winner = state.players.find(isInHand) as PokerPlayer;
  const players = state.players.map((player) =>
    player.seat === winner.seat
      ? { ...player, chips: player.chips + pot, bet: 0 }
      : { ...player, bet: 0 },
  );

  return {
    ...state,
    players,
    phase: 'hand-end',
    result: {
      showdown: false,
      pots: [{ amount: pot, winners: [winner.seat], hand: null }],
    },
  };
}

/** After an action: end the hand, close the betting round or pass the turn. */
function resolveTurn(state: PokerState, lastSeat: number): PokerState {
  const { players, currentBet } = state;

  if (players.filter(isInHand).length === 1) return awardUncontested(state);

  const actors = players.filter(canAct);
  const waiting = actors.filter(
    (player) => !player.acted || player.bet < currentBet,
  );
  const lonelyActor =
    actors.length === 1 && actors[0].bet >= currentBet && waiting.length <= 1;

  if (waiting.length === 0 || actors.length === 0 || lonelyActor) {
    return { ...state, phase: 'street-end' };
  }

  const turn = nextSeat(players, lastSeat, (player) =>
    waiting.some((other) => other.seat === player.seat),
  );

  return { ...state, phase: 'betting', turn };
}

export function startHand(
  state: PokerState,
  random: Random = Math.random,
): PokerState {
  const mode = POKER_MODES[state.modeId];
  const handNumber = state.handNumber + 1;
  const { level, smallBlind, bigBlind } = blindsFor(state.modeId, handNumber);
  const deck = shuffle(createDeck(), random);

  let players: PokerPlayer[] = state.players.map((player) => {
    const rebuy =
      mode.rebuy && player.chips === 0 && player.seat !== HUMAN_SEAT;
    const chips = rebuy ? mode.startingStack : player.chips;

    return {
      ...player,
      chips,
      rebuys: player.rebuys + (rebuy ? 1 : 0),
      out: chips === 0,
      hand: [],
      bet: 0,
      committed: 0,
      folded: false,
      allIn: false,
      acted: false,
      lastAction: rebuy ? 'Recomprou' : null,
    };
  });

  players = players.map((player) =>
    player.out ? player : { ...player, hand: deck.splice(0, 2) },
  );

  const active = (player: PokerPlayer) => !player.out;
  const activeCount = players.filter(active).length;
  const dealer = nextSeat(players, state.dealer, active);
  const smallBlindSeat =
    activeCount === 2 ? dealer : nextSeat(players, dealer, active);
  const bigBlindSeat = nextSeat(players, smallBlindSeat, active);

  players[smallBlindSeat] = postChips(players[smallBlindSeat], smallBlind);
  players[bigBlindSeat] = postChips(players[bigBlindSeat], bigBlind);

  const next: PokerState = {
    ...state,
    players,
    deck,
    board: [],
    handNumber,
    level,
    smallBlind,
    bigBlind,
    dealer,
    smallBlindSeat,
    bigBlindSeat,
    street: 'preflop',
    turn: bigBlindSeat,
    currentBet: Math.max(...players.map((player) => player.bet)),
    minRaise: bigBlind,
    phase: 'betting',
    reveal: false,
    result: null,
  };

  return resolveTurn(next, bigBlindSeat);
}

export function createGame(
  modeId: PokerModeId,
  count: PokerPlayerCount,
  random: Random = Math.random,
): PokerState {
  const { startingStack } = POKER_MODES[modeId];
  const players: PokerPlayer[] = Array.from({ length: count }, (_, seat) => ({
    seat,
    name: SEAT_NAMES[seat],
    chips: startingStack,
    hand: [],
    bet: 0,
    committed: 0,
    folded: false,
    allIn: false,
    acted: false,
    out: false,
    lastAction: null,
    rebuys: 0,
  }));

  return startHand(
    {
      modeId,
      players,
      deck: [],
      board: [],
      handNumber: 0,
      level: 0,
      smallBlind: 0,
      bigBlind: 0,
      // The first hand moves the button to the next seat.
      dealer: Math.floor(random() * count),
      smallBlindSeat: 0,
      bigBlindSeat: 0,
      street: 'preflop',
      turn: 0,
      currentBet: 0,
      minRaise: 0,
      phase: 'betting',
      reveal: false,
      result: null,
      place: null,
    },
    random,
  );
}

export function getLegalActions(
  state: PokerState,
  seat: number,
): PokerLegalActions {
  const player = state.players[seat];
  const toCall = Math.min(state.currentBet - player.bet, player.chips);
  const maxRaiseTo = player.bet + player.chips;
  const minRaiseTo = Math.min(
    state.currentBet + Math.max(state.minRaise, state.bigBlind),
    maxRaiseTo,
  );
  const othersCanAct = state.players.some(
    (other) => other.seat !== seat && canAct(other),
  );

  return {
    toCall,
    canCheck: toCall === 0,
    canRaise: othersCanAct && maxRaiseTo > state.currentBet,
    minRaiseTo,
    maxRaiseTo,
  };
}

export function isHumanTurn(state: PokerState): boolean {
  return state.phase === 'betting' && state.turn === HUMAN_SEAT;
}

export function applyAction(
  state: PokerState,
  seat: number,
  action: PokerAction,
): PokerState {
  if (state.phase !== 'betting' || state.turn !== seat) return state;

  const legal = getLegalActions(state, seat);
  let players = [...state.players];
  let player = players[seat];
  let { currentBet, minRaise } = state;

  switch (action.type) {
    case 'fold':
      player = { ...player, folded: true, lastAction: 'Fold' };
      break;
    case 'check':
    case 'call': {
      if (legal.toCall === 0) {
        player = { ...player, lastAction: 'Mesa' };
        break;
      }
      player = postChips(player, legal.toCall);
      player.lastAction = player.allIn
        ? 'All-in'
        : `Pago ${formatChips(player.bet)}`;
      break;
    }
    default: {
      if (!legal.canRaise) return applyAction(state, seat, { type: 'call' });

      const to = Math.max(
        legal.minRaiseTo,
        Math.min(Math.round(action.to), legal.maxRaiseTo),
      );
      const opening = currentBet === 0;

      player = postChips(player, to - player.bet);
      minRaise = Math.max(minRaise, to - currentBet);
      currentBet = Math.max(currentBet, to);

      let label = opening
        ? `Aposta ${formatChips(to)}`
        : `Aumenta p/ ${formatChips(to)}`;
      if (player.allIn) label = 'All-in';
      player.lastAction = label;

      // A raise reopens the betting for everybody else.
      players = players.map((other) =>
        other.seat === seat ? other : { ...other, acted: false },
      );
    }
  }

  players[seat] = { ...player, acted: true };

  return resolveTurn({ ...state, players, currentBet, minRaise }, seat);
}

function splitPots(
  state: PokerState,
): { amount: number; eligible: number[] }[] {
  const { players } = state;
  const live = players.filter(isInHand);
  const levels = [...new Set(live.map((player) => player.committed))].sort(
    (a, b) => a - b,
  );
  const pots: { amount: number; eligible: number[] }[] = [];
  let previous = 0;

  levels.forEach((level) => {
    const amount = players.reduce(
      (sum, player) =>
        sum +
        Math.min(player.committed, level) -
        Math.min(player.committed, previous),
      0,
    );
    const eligible = live
      .filter((player) => player.committed >= level)
      .map((player) => player.seat);
    const last = pots[pots.length - 1];

    if (last && last.eligible.length === eligible.length) {
      last.amount += amount;
    } else if (amount > 0) {
      pots.push({ amount, eligible });
    }
    previous = level;
  });

  // Chips from folded players above every all-in go to the last pot.
  const leftover =
    getPot(state) - pots.reduce((sum, pot) => sum + pot.amount, 0);
  if (leftover > 0 && pots.length) pots[pots.length - 1].amount += leftover;

  return pots;
}

function showdown(state: PokerState): PokerState {
  const ranks = new Map<number, PokerHandRank>();
  state.players.filter(isInHand).forEach((player) => {
    ranks.set(player.seat, rankHand([...player.hand, ...state.board]));
  });

  const chips = state.players.map((player) => player.chips);
  // Odd chips go to the first winner to the left of the button.
  const order = (seat: number) =>
    (seat - state.dealer - 1 + state.players.length) % state.players.length;

  const pots: PokerPotResult[] = splitPots(state).map(
    ({ amount, eligible }) => {
      const best = Math.max(
        ...eligible.map((seat) => (ranks.get(seat) as PokerHandRank).score),
      );
      const winners = eligible
        .filter((seat) => ranks.get(seat)?.score === best)
        .sort((a, b) => order(a) - order(b));
      const share = Math.floor(amount / winners.length);
      let remainder = amount - share * winners.length;

      winners.forEach((seat) => {
        chips[seat] += share + (remainder > 0 ? 1 : 0);
        remainder -= 1;
      });

      return { amount, winners, hand: ranks.get(winners[0]) ?? null };
    },
  );

  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      chips: chips[player.seat],
      bet: 0,
    })),
    phase: 'hand-end',
    reveal: true,
    result: { showdown: true, pots },
  };
}

/** Pulls the bets to the middle and deals the next street (or goes to showdown). */
export function nextStreet(state: PokerState): PokerState {
  const street = NEXT_STREET[state.street];
  if (!street) return showdown(state);

  const deck = [...state.deck];
  const board = [...state.board, ...deck.splice(0, STREET_CARDS[street])];
  const players = state.players.map((player) => ({
    ...player,
    bet: 0,
    acted: false,
    lastAction:
      player.folded || player.allIn || player.out ? player.lastAction : null,
  }));
  const next: PokerState = {
    ...state,
    players,
    deck,
    board,
    street,
    currentBet: 0,
    minRaise: state.bigBlind,
  };

  // Nobody left to bet against: run the rest of the board face up.
  if (players.filter(canAct).length <= 1) {
    return { ...next, phase: 'street-end', reveal: true };
  }

  return {
    ...next,
    phase: 'betting',
    turn: nextSeat(players, state.dealer, canAct),
  };
}

/** After a hand: deal the next one or end the game. */
export function finishHand(
  state: PokerState,
  random: Random = Math.random,
): PokerState {
  const { rebuy } = POKER_MODES[state.modeId];
  const human = state.players[HUMAN_SEAT];
  const standing = state.players.filter((player) => player.chips > 0);

  if (human.chips === 0) {
    return { ...state, phase: 'game-over', place: standing.length + 1 };
  }

  if (!rebuy && standing.length === 1) {
    return { ...state, phase: 'game-over', place: 1 };
  }

  return startHand(state, random);
}

/** Human leaves a cash game table. */
export function leaveTable(state: PokerState): PokerState {
  return { ...state, phase: 'game-over', place: null };
}

/**
 * Hack: trades one of the player's hole cards for a random card still in the
 * deck. The old card goes back to the deck, so it can still show up later.
 */
export function swapHoleCard(
  state: PokerState,
  seat: number,
  cardId: string,
  random: Random = Math.random,
): PokerState {
  const player = state.players[seat];
  const index = player.hand.findIndex((card) => card.id === cardId);
  const handOver = state.phase === 'hand-end' || state.phase === 'game-over';
  if (handOver || index < 0 || !isInHand(player) || !state.deck.length) {
    return state;
  }

  const deck = [...state.deck];
  const deckIndex = Math.floor(random() * deck.length);
  const hand = [...player.hand];
  [hand[index], deck[deckIndex]] = [deck[deckIndex], hand[index]];

  return {
    ...state,
    deck,
    players: state.players.map((current) =>
      current.seat === seat ? { ...current, hand } : current,
    ),
  };
}
