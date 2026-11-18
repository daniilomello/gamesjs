export type PokerSuit = 'copas' | 'ouros' | 'paus' | 'espadas';

/** 2 to 14, where 11 is J, 12 Q, 13 K and 14 the ace. */
export type PokerRank = number;

export type PokerCard = {
  id: string;
  rank: PokerRank;
  suit: PokerSuit;
};

export type PokerModeId = 'torneio' | 'cash';

export type PokerMode = {
  id: PokerModeId;
  name: string;
  tagline: string;
  startingStack: number;
  /** Small and big blind of each level. */
  blindLevels: [number, number][];
  /** Hands played before the blinds go up, `null` when they never change. */
  handsPerLevel: number | null;
  /** Bots that bust buy back in instead of leaving the table. */
  rebuy: boolean;
  rules: string[];
};

export type PokerPlayerCount = 2 | 3 | 4 | 5 | 6;

export type PokerPlayer = {
  seat: number;
  name: string;
  chips: number;
  hand: PokerCard[];
  /** Chips put in during the current betting round. */
  bet: number;
  /** Chips put in during the whole hand. */
  committed: number;
  folded: boolean;
  allIn: boolean;
  /** Acted since the last bet or raise. */
  acted: boolean;
  /** Busted out of a tournament. */
  out: boolean;
  lastAction: string | null;
  rebuys: number;
};

export type PokerStreet = 'preflop' | 'flop' | 'turn' | 'river';

export type PokerPhase = 'betting' | 'street-end' | 'hand-end' | 'game-over';

export type PokerAction =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'raise'; to: number };

export type PokerHandRank = {
  /** 0 (high card) to 9 (royal flush). */
  category: number;
  score: number;
  name: string;
  /** The five cards that make the hand. */
  cards: PokerCard[];
};

export type PokerPotResult = {
  amount: number;
  winners: number[];
  /** Winning hand, `null` when everybody else folded. */
  hand: PokerHandRank | null;
};

export type PokerHandResult = {
  pots: PokerPotResult[];
  showdown: boolean;
};

export type PokerLegalActions = {
  toCall: number;
  canCheck: boolean;
  canRaise: boolean;
  minRaiseTo: number;
  maxRaiseTo: number;
};

export type PokerState = {
  modeId: PokerModeId;
  players: PokerPlayer[];
  deck: PokerCard[];
  board: PokerCard[];
  handNumber: number;
  level: number;
  smallBlind: number;
  bigBlind: number;
  dealer: number;
  smallBlindSeat: number;
  bigBlindSeat: number;
  street: PokerStreet;
  turn: number;
  currentBet: number;
  /** Smallest raise increment allowed right now. */
  minRaise: number;
  phase: PokerPhase;
  /** Hands are face up: showdown or an all-in run-out. */
  reveal: boolean;
  result: PokerHandResult | null;
  /** Human finishing place when the game is over (1 is a win). */
  place: number | null;
};
