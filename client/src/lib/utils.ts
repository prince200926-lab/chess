import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function squareToCoords(square: string): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - parseInt(square[1]);
  return { file, rank };
}

export function coordsToSquare(file: number, rank: number): string {
  return String.fromCharCode(97 + file) + (8 - rank);
}

export function getPieceSymbol(piece: string): string {
  const symbols: Record<string, string> = {
    'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙',
    'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟',
  };
  return symbols[piece] || '';
}

export function isLightSquare(file: number, rank: number): boolean {
  return (file + rank) % 2 === 0;
}