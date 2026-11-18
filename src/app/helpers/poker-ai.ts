import { PokerAction, PokerCard, PokerState } from '@app/types/poker';

import { createDeck, handScore } from './poker-cards';
import { getLegalActions, getPot, isInHand } from './poker-logic';
import { BOT_STYLES } from './poker-seats';

type Random = () => number;

const SIMULATIONS = 350;

/**
 * Chance of winning at showdown against random hands, found by dealing the
 * rest of the board and the opponents' cards many times.
 */
export function estimateEquity(
  hand: PokerCard[],
  board: PokerCard[],
  opponents: number,
  random: Random = Math.random,
  simulations = SIMULATIONS,
): number {
  const known = new Set([...hand, ...board].map((card) => card.id));
  const deck = createDeck().filter((card) => !known.has(card.id));
  const missing = 5 - board.length;
  const needed = missing + opponents * 2;
  let total = 0;

  for (let run = 0; run < simulations; run += 1) {
    // Partial shuffle: only the cards we need are drawn.
    for (let i = 0; i < needed; i += 1) {
      const j = i + Math.floor(random() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const fullBoard = board.concat(deck.slice(0, missing));
    const mine = handScore(hand.concat(fullBoard));
    let tied = 0;
    let lost = false;

    for (let opponent = 0; opponent < opponents && !lost; opponent += 1) {
      const start = missing + opponent * 2;
      const theirs = handScore(deck.slice(start, start + 2).concat(fullBoard));
      if (theirs > mine) lost = true;
      else if (theirs === mine) tied += 1;
    }

    if (!lost) total += 1 / (tied + 1);
  }

  return total / simulations;
}

function roundTo(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

export function chooseBotAction(
  state: PokerState,
  seat: number,
  random: Random = Math.random,
): PokerAction {
  const player = state.players[seat];
  const style = BOT_STYLES[seat] ?? BOT_STYLES[1];
  const legal = getLegalActions(state, seat);
  const opponents = state.players.filter(
    (other) => other.seat !== seat && isInHand(other),
  ).length;
  const equity = estimateEquity(player.hand, state.board, opponents, random);
  const pot = getPot(state);
  const preflop = state.street === 'preflop';

  // Above 1 the hand is better than an average one at this table.
  const strength =
    equity * (opponents + 1) + (random() - 0.5) * 0.3 + style.aggression * 0.25;

  const raiseTo = (fraction: number) => {
    const size = Math.max(state.bigBlind, pot * fraction);
    const target = state.currentBet + roundTo(size, state.smallBlind);
    let to = Math.min(Math.max(target, legal.minRaiseTo), legal.maxRaiseTo);

    // Not worth keeping a tiny stack behind: shove instead.
    if (legal.maxRaiseTo - to < pot * 0.3) to = legal.maxRaiseTo;
    return { type: 'raise', to } as const;
  };

  if (legal.canCheck) {
    if (legal.canRaise && strength > 1.45 + (random() < 0.25 ? 0.6 : 0)) {
      return raiseTo(preflop ? 0.9 : 0.5 + random() * 0.4);
    }
    if (
      legal.canRaise &&
      !preflop &&
      opponents <= 2 &&
      random() < style.bluff
    ) {
      return raiseTo(0.5);
    }
    return { type: 'check' };
  }

  const potOdds = legal.toCall / (pot + legal.toCall);
  const allInCall = legal.toCall >= player.chips;
  // Calling a big bet needs a better hand than the price alone suggests.
  const pressure =
    Math.min(legal.toCall / Math.max(pot, 1), 1) * (preflop ? 0.12 : 0.3);
  const implied = preflop || state.street === 'flop' ? 0.8 : 1;
  const needed =
    potOdds * implied +
    pressure -
    style.looseness * 0.1 +
    (allInCall ? 0.05 : 0);

  const raiseBar = preflop && state.currentBet <= state.bigBlind ? 1.35 : 1.75;
  if (
    legal.canRaise &&
    strength > raiseBar &&
    random() < 0.55 + style.aggression
  ) {
    return raiseTo(preflop ? 1 : 0.75);
  }
  if (equity >= needed) return { type: 'call' };
  if (
    legal.canRaise &&
    !preflop &&
    !allInCall &&
    opponents === 1 &&
    random() < style.bluff * 0.5
  ) {
    return raiseTo(0.8);
  }

  return { type: 'fold' };
}
