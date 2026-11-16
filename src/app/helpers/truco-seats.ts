import { SUIT_SYMBOLS } from '@app/helpers/truco-variants';
import { TrucoCard, TrucoPlayerCount } from '@app/types/truco';

export type SeatPosition = 'bottom' | 'right' | 'top' | 'left';

/** Seats are numbered in playing order (counterclockwise), starting at the human. */
const POSITIONS: Record<TrucoPlayerCount, SeatPosition[]> = {
  2: ['bottom', 'top'],
  4: ['bottom', 'right', 'top', 'left'],
};

const NAMES: Record<TrucoPlayerCount, string[]> = {
  2: ['Você', 'Zeca'],
  4: ['Você', 'Zeca', 'Parceiro', 'Tião'],
};

export function seatPosition(
  seat: number,
  players: TrucoPlayerCount,
): SeatPosition {
  return POSITIONS[players][seat];
}

export function seatName(seat: number, players: TrucoPlayerCount): string {
  return NAMES[players][seat];
}

export function cardName(card: TrucoCard): string {
  return `${card.rank} de ${card.suit} ${SUIT_SYMBOLS[card.suit]}`;
}
