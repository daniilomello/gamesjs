import {
  TrucoCard,
  TrucoRank,
  TrucoSuit,
  TrucoVariant,
  TrucoVariantId,
} from '@app/types/truco';

/** Weakest to strongest. */
export const TRUCO_RANKS: TrucoRank[] = [
  '4',
  '5',
  '6',
  '7',
  'Q',
  'J',
  'K',
  'A',
  '2',
  '3',
];

/** Weakest to strongest, used to rank manilhas of the same rank. */
export const TRUCO_SUITS: TrucoSuit[] = ['ouros', 'espadas', 'copas', 'paus'];

export const SUIT_SYMBOLS: Record<TrucoSuit, string> = {
  ouros: '♦',
  espadas: '♠',
  copas: '♥',
  paus: '♣',
};

/** Clean deck: the 4, 5, 6 and 7 are taken out. */
const CLEAN_RANKS: TrucoRank[] = ['Q', 'J', 'K', 'A', '2', '3'];

/** Fixed manilhas of Truco Mineiro, weakest to strongest. */
export const FIXED_MANILHA_CARDS: TrucoCard[] = [
  { id: '7-ouros', rank: '7', suit: 'ouros' },
  { id: 'A-espadas', rank: 'A', suit: 'espadas' },
  { id: '7-copas', rank: '7', suit: 'copas' },
  { id: '4-paus', rank: '4', suit: 'paus' },
];

export const FIXED_MANILHAS = FIXED_MANILHA_CARDS.map((card) => card.id);

export const STAKE_CALLS = ['Truco', 'Seis', 'Nove', 'Doze'];

export const TRUCO_VARIANTS: Record<TrucoVariantId, TrucoVariant> = {
  paulista: {
    id: 'paulista',
    name: 'Truco Paulista',
    tagline: 'Baralho limpo de 24 cartas, manilha pela vira.',
    ranks: CLEAN_RANKS,
    manilha: 'vira',
    stakes: [1, 3, 6, 9, 12],
    target: 12,
    decisiveName: 'Mão de onze',
    decisiveValue: 3,
    blindIronHand: true,
    rules: [
      'Baralho limpo: saem os 4, 5, 6 e 7 e sobram 24 cartas (Q, J, K, A, 2, 3).',
      'A carta virada (vira) define a manilha: é a carta seguinte a ela na ordem Q, J, K, A, 2, 3 (se virar um 3, a manilha é a dama).',
      'Entre as manilhas vale o naipe: ouros < espadas < copas < paus (zap).',
      'A mão vale 1 ponto. Truco vale 3, seis vale 6, nove vale 9 e doze vale 12.',
      'Mão de onze: quem tem 11 pontos vê as cartas e decide se joga (vale 3) ou corre (1 ponto para o adversário). Não pode pedir truco.',
      'Mão de ferro (11 a 11): todo mundo joga sem ver as próprias cartas.',
    ],
  },
  mineiro: {
    id: 'mineiro',
    name: 'Truco Mineiro',
    tagline:
      'Baralho limpo com manilhas fixas: zap, copas, espadilha e pica-fumo.',
    ranks: CLEAN_RANKS,
    extraCards: FIXED_MANILHA_CARDS,
    manilha: 'fixed',
    stakes: [2, 4, 8, 10, 12],
    target: 12,
    decisiveName: 'Mão de dez',
    decisiveValue: 4,
    blindIronHand: false,
    rules: [
      'Não tem vira. As manilhas são sempre as mesmas: 4♣ (zap) > 7♥ (copas) > A♠ (espadilha) > 7♦ (pica-fumo).',
      'Baralho limpo: saem os 4, 5, 6 e 7, menos as três manilhas (4♣, 7♥ e 7♦). Ficam 27 cartas.',
      'As outras cartas seguem a ordem Q, J, K, A, 2, 3.',
      'A mão vale 2 pontos. Truco vale 4, seis vale 8, nove vale 10 e doze vale 12.',
      'Mão de dez: quem tem 10 pontos vê as cartas e decide se joga (vale 4) ou corre (2 pontos para o adversário). Não pode pedir truco.',
      'Com 10 a 10 a mão é jogada sem truco: quem ganhar leva a partida.',
    ],
  },
};

export const TRUCO_VARIANT_LIST = Object.values(TRUCO_VARIANTS);
