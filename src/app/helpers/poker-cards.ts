import {
  PokerCard,
  PokerHandRank,
  PokerMode,
  PokerModeId,
  PokerRank,
  PokerSuit,
} from '@app/types/poker';

export const POKER_SUITS: PokerSuit[] = ['espadas', 'copas', 'paus', 'ouros'];

export const SUIT_SYMBOLS: Record<PokerSuit, string> = {
  espadas: '♠',
  copas: '♥',
  paus: '♣',
  ouros: '♦',
};

const RANK_LABELS: Record<number, string> = {
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export function rankLabel(rank: PokerRank): string {
  return RANK_LABELS[rank] ?? String(rank);
}

export function cardName(card: PokerCard): string {
  return `${rankLabel(card.rank)} de ${card.suit} ${SUIT_SYMBOLS[card.suit]}`;
}

export const POKER_MODES: Record<PokerModeId, PokerMode> = {
  torneio: {
    id: 'torneio',
    name: 'Torneio',
    tagline:
      'Todo mundo começa com 1.500 fichas e os blinds sobem a cada 6 mãos. Ganha quem ficar com tudo.',
    startingStack: 1500,
    blindLevels: [
      [10, 20],
      [15, 30],
      [25, 50],
      [50, 100],
      [75, 150],
      [100, 200],
      [150, 300],
      [200, 400],
      [300, 600],
      [500, 1000],
    ],
    handsPerLevel: 6,
    rebuy: false,
    rules: [
      'Cada jogador começa com 1.500 fichas.',
      'Os blinds começam em 10/20 e sobem a cada 6 mãos.',
      'Quem fica sem fichas sai da mesa. Ganha o último que sobrar.',
    ],
  },
  cash: {
    id: 'cash',
    name: 'Cash game',
    tagline:
      'Blinds fixos de 5/10 e 1.000 fichas. Quem quebra recompra; jogue até cansar e veja quanto lucrou.',
    startingStack: 1000,
    blindLevels: [[5, 10]],
    handsPerLevel: null,
    rebuy: true,
    rules: [
      'Cada jogador senta com 1.000 fichas e os blinds ficam em 5/10.',
      'Adversário que quebra recompra mais 1.000 fichas na hora.',
      'O jogo acaba quando você quebra ou levanta da mesa.',
    ],
  },
};

export const POKER_MODE_LIST = Object.values(POKER_MODES);

export function createDeck(): PokerCard[] {
  return POKER_SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => {
      const rank = index + 2;
      return { id: `${rank}-${suit}`, rank, suit };
    }),
  );
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export const HAND_CATEGORIES = [
  'Carta alta',
  'Par',
  'Dois pares',
  'Trinca',
  'Sequência',
  'Flush',
  'Full house',
  'Quadra',
  'Straight flush',
  'Royal flush',
];

type Evaluation = {
  category: number;
  /** Ranks that break ties, most important first. */
  kickers: number[];
  /** The five ranks of the hand, with repeats, used to pick the cards. */
  ranks: number[];
  flushSuit: PokerSuit | null;
};

/** Highest card of a five-card run in a set of ranks (the wheel counts as 5). */
function straightHigh(present: Set<number>): number | null {
  for (let high = 14; high >= 5; high -= 1) {
    let run = true;
    for (let offset = 0; offset < 5 && run; offset += 1) {
      const rank = high - offset;
      run = present.has(rank === 1 ? 14 : rank);
    }
    if (run) return high;
  }

  return null;
}

function straightRanks(high: number): number[] {
  return [0, 1, 2, 3, 4].map((offset) =>
    high - offset === 1 ? 14 : high - offset,
  );
}

/** Best five-card hand out of five to seven cards. */
function evaluate(cards: PokerCard[]): Evaluation {
  const counts = new Map<number, number>();
  const bySuit = new Map<PokerSuit, number[]>();

  cards.forEach(({ rank, suit }) => {
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
    bySuit.set(suit, [...(bySuit.get(suit) ?? []), rank]);
  });

  const flushSuit =
    POKER_SUITS.find((suit) => (bySuit.get(suit)?.length ?? 0) >= 5) ?? null;
  const suited = flushSuit
    ? [...(bySuit.get(flushSuit) ?? [])].sort((a, b) => b - a)
    : [];

  if (flushSuit) {
    const high = straightHigh(new Set(suited));
    if (high) {
      return {
        category: high === 14 ? 9 : 8,
        kickers: [high],
        ranks: straightRanks(high),
        flushSuit,
      };
    }
  }

  // Ranks grouped by how many times they show up, biggest groups first.
  const groups = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || b[0] - a[0],
  );
  const singles = [...counts.keys()].sort((a, b) => b - a);
  const repeat = (rank: number, times: number) =>
    Array.from({ length: times }, () => rank);
  const kickersBesides = (taken: number[], amount: number) =>
    singles.filter((rank) => !taken.includes(rank)).slice(0, amount);

  const [first, second] = groups;

  if (first[1] === 4) {
    const kicker = kickersBesides([first[0]], 1);
    return {
      category: 7,
      kickers: [first[0], ...kicker],
      ranks: [...repeat(first[0], 4), ...kicker],
      flushSuit: null,
    };
  }

  if (first[1] === 3 && second && second[1] >= 2) {
    return {
      category: 6,
      kickers: [first[0], second[0]],
      ranks: [...repeat(first[0], 3), ...repeat(second[0], 2)],
      flushSuit: null,
    };
  }

  if (flushSuit) {
    const top = suited.slice(0, 5);
    return { category: 5, kickers: top, ranks: top, flushSuit };
  }

  const high = straightHigh(new Set(singles));
  if (high) {
    return {
      category: 4,
      kickers: [high],
      ranks: straightRanks(high),
      flushSuit: null,
    };
  }

  if (first[1] === 3) {
    const kickers = kickersBesides([first[0]], 2);
    return {
      category: 3,
      kickers: [first[0], ...kickers],
      ranks: [...repeat(first[0], 3), ...kickers],
      flushSuit: null,
    };
  }

  if (first[1] === 2 && second && second[1] === 2) {
    const kicker = kickersBesides([first[0], second[0]], 1);
    return {
      category: 2,
      kickers: [first[0], second[0], ...kicker],
      ranks: [...repeat(first[0], 2), ...repeat(second[0], 2), ...kicker],
      flushSuit: null,
    };
  }

  if (first[1] === 2) {
    const kickers = kickersBesides([first[0]], 3);
    return {
      category: 1,
      kickers: [first[0], ...kickers],
      ranks: [...repeat(first[0], 2), ...kickers],
      flushSuit: null,
    };
  }

  const top = singles.slice(0, 5);
  return { category: 0, kickers: top, ranks: top, flushSuit: null };
}

function scoreOf({ category, kickers }: Evaluation): number {
  return kickers
    .concat([0, 0, 0, 0, 0])
    .slice(0, 5)
    .reduce((score, rank) => score * 15 + rank, category);
}

/** Fast comparable score of the best hand in five to seven cards. */
export function handScore(cards: PokerCard[]): number {
  return scoreOf(evaluate(cards));
}

function handName({ category, kickers, flushSuit }: Evaluation): string {
  const [a, b] = kickers.map(rankLabel);

  switch (category) {
    case 0:
      return `Carta alta ${a}`;
    case 1:
      return `Par de ${a}`;
    case 2:
      return `Dois pares, ${a} e ${b}`;
    case 3:
      return `Trinca de ${a}`;
    case 4:
      return `Sequência até o ${a}`;
    case 5:
      return `Flush de ${flushSuit} ${flushSuit ? SUIT_SYMBOLS[flushSuit] : ''}`;
    case 6:
      return `Full house, ${a} com ${b}`;
    case 7:
      return `Quadra de ${a}`;
    case 8:
      return `Straight flush até o ${a}`;
    default:
      return 'Royal flush';
  }
}

export function rankHand(cards: PokerCard[]): PokerHandRank {
  const evaluation = evaluate(cards);
  const pool = [...cards];
  const picked = evaluation.ranks.map((rank) => {
    const index = pool.findIndex(
      (card) =>
        card.rank === rank &&
        (!evaluation.flushSuit || card.suit === evaluation.flushSuit),
    );
    return pool.splice(index, 1)[0];
  });

  return {
    category: evaluation.category,
    score: scoreOf(evaluation),
    name: handName(evaluation),
    cards: picked,
  };
}

export function formatChips(value: number): string {
  return value.toLocaleString('pt-BR');
}
