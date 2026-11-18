import { PokerPlayerCount } from '@app/types/poker';

export const HUMAN_SEAT = 0;

export const SEAT_NAMES = [
  'Você',
  'Zeca',
  'Dona Neide',
  'Tião',
  'Rosa',
  'Juca',
];

/** How each bot plays: looser bots call more, aggressive ones bet and bluff more. */
export type BotStyle = {
  looseness: number;
  aggression: number;
  bluff: number;
};

export const BOT_STYLES: BotStyle[] = [
  { looseness: 0, aggression: 0, bluff: 0 },
  // Zeca: solto e agressivo.
  { looseness: 0.25, aggression: 0.35, bluff: 0.16 },
  // Dona Neide: fechada e agressiva.
  { looseness: -0.15, aggression: 0.3, bluff: 0.08 },
  // Tião: fechado e passivo.
  { looseness: -0.2, aggression: -0.2, bluff: 0.03 },
  // Rosa: equilibrada.
  { looseness: 0, aggression: 0.1, bluff: 0.1 },
  // Juca: paga tudo.
  { looseness: 0.35, aggression: -0.25, bluff: 0.05 },
];

/** Seat spots around the oval table, as left/top percentages. Seat 0 is the human. */
const SPOTS: Record<PokerPlayerCount, [number, number][]> = {
  2: [
    [50, 86],
    [50, 13],
  ],
  3: [
    [50, 86],
    [17, 18],
    [83, 18],
  ],
  4: [
    [50, 86],
    [11, 72],
    [50, 13],
    [89, 72],
  ],
  5: [
    [50, 86],
    [11, 72],
    [22, 15],
    [78, 15],
    [89, 72],
  ],
  6: [
    [50, 86],
    [11, 72],
    [16, 18],
    [50, 13],
    [84, 18],
    [89, 72],
  ],
};

export function seatSpot(seat: number, players: number): [number, number] {
  return SPOTS[players as PokerPlayerCount][seat];
}
