export type TrucoSuit = 'ouros' | 'espadas' | 'copas' | 'paus';

export type TrucoRank =
  | '4'
  | '5'
  | '6'
  | '7'
  | 'Q'
  | 'J'
  | 'K'
  | 'A'
  | '2'
  | '3';

export type TrucoCard = {
  id: string;
  rank: TrucoRank;
  suit: TrucoSuit;
};

export type TrucoTeam = 0 | 1;

export type TrucoVariantId = 'paulista' | 'mineiro' | 'limpo';

export type TrucoPlayerCount = 2 | 4;

export type TrucoVariant = {
  id: TrucoVariantId;
  name: string;
  tagline: string;
  /** Ranks in the deck, weakest first. */
  ranks: TrucoRank[];
  /** `vira`: the manilha is the rank after the turned card. `fixed`: always the same four cards. */
  manilha: 'vira' | 'fixed';
  /** Hand value at each betting level (no bet, truco, seis, nove, doze). */
  stakes: number[];
  target: number;
  /** Name and value of the hand played when one team is one hand away from winning. */
  decisiveName: string;
  decisiveValue: number;
  /** When both teams are one hand away, cards are played without being seen. */
  blindIronHand: boolean;
  rules: string[];
};

export type TrucoDeal = {
  hands: TrucoCard[][];
  vira: TrucoCard | null;
};

export type TrucoPlay = {
  seat: number;
  card: TrucoCard;
  faceDown: boolean;
};

export type TrucoRoundResult = TrucoTeam | 'tie';

export type TrucoPhase =
  | 'decision'
  | 'playing'
  | 'response'
  | 'round-end'
  | 'hand-end'
  | 'game-over';

export type TrucoHandMode = 'normal' | 'decisive' | 'iron';

export type TrucoResponse = 'accept' | 'run' | 'raise';

export type TrucoPending = {
  seat: number;
  team: TrucoTeam;
  stakeIndex: number;
};

export type TrucoSpeech = {
  seat: number;
  text: string;
};

export type TrucoHandResult = {
  winner: TrucoTeam | null;
  points: number;
  reason: 'rounds' | 'run' | 'fold' | 'draw';
};

export type TrucoState = {
  variantId: TrucoVariantId;
  players: TrucoPlayerCount;
  scores: [number, number];
  handNumber: number;
  /** Seat that leads the first round of the current hand. */
  starter: number;
  hands: TrucoCard[][];
  vira: TrucoCard | null;
  turn: number;
  trick: TrucoPlay[];
  /** Seat that won the trick on the table, `null` while it is open or when it tied. */
  trickWinner: number | null;
  nextLeader: number;
  rounds: TrucoRoundResult[];
  stakeIndex: number;
  /** Team whose raise was accepted last; it cannot raise again until the other team does. */
  raisedBy: TrucoTeam | null;
  pending: TrucoPending | null;
  phase: TrucoPhase;
  mode: TrucoHandMode;
  decisionTeam: TrucoTeam | null;
  handResult: TrucoHandResult | null;
  speech: TrucoSpeech | null;
  winner: TrucoTeam | null;
};

export type TrucoBotAction =
  | { type: 'truco' }
  | { type: 'play'; cardId: string };
