import { Chess, Square } from 'chess.js';
import type { Move, GameState, PlayerColor, Piece } from '../types';

export class ChessGame {
  private chess: Chess;
  private moveHistory: Move[] = [];

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  getFen(): string {
    return this.chess.fen();
  }

  getTurn(): PlayerColor {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  getStatus(): GameState['status'] {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isDraw()) return 'draw';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isCheck()) return 'check';
    return 'active';
  }

  getWinner(): PlayerColor | undefined {
    if (this.chess.isCheckmate()) {
      return this.chess.turn() === 'w' ? 'black' : 'white';
    }
    return undefined;
  }

  getDrawReason(): string | undefined {
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isThreefoldRepetition()) return 'threefold_repetition';
    if (this.chess.isInsufficientMaterial()) return 'insufficient_material';
    if (this.chess.isDraw()) return 'draw';
    return undefined;
  }

  getLegalMoves(square?: Square): string[] {
    return this.chess.moves({ square, verbose: false }) as string[];
  }

  getLegalMovesVerbose(square?: Square): Array<{ from: string; to: string; promotion?: string; san: string }> {
    return this.chess.moves({ square, verbose: true }) as Array<{ from: string; to: string; promotion?: string; san: string }>;
  }

  makeMove(move: { from: string; to: string; promotion?: string }): Move | null {
    try {
      const result = this.chess.move(move);
      if (!result) return null;

      const moveObj: Move = {
        from: move.from,
        to: move.to,
        promotion: move.promotion as Move['promotion'],
        san: result.san,
        fen: this.chess.fen(),
        timestamp: Date.now(),
        playerId: '',
      };

      this.moveHistory.push(moveObj);
      return moveObj;
    } catch {
      return null;
    }
  }

  undoMove(): Move | null {
    const move = this.chess.undo();
    if (!move) return null;

    const undoneMove = this.moveHistory.pop() || null;
    return undoneMove;
  }

  undoMoves(count: number): Move[] {
    const undone: Move[] = [];
    for (let i = 0; i < count; i++) {
      const move = this.undoMove();
      if (!move) break;
      undone.push(move);
    }
    return undone;
  }

  redoMove(move: Move): boolean {
    try {
      const result = this.chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      if (!result) return false;

      this.moveHistory.push(move);
      return true;
    } catch {
      return false;
    }
  }

  getMoveHistory(): Move[] {
    return [...this.moveHistory];
  }

  getMoveCount(): number {
    return this.moveHistory.length;
  }

  loadFromFen(fen: string): boolean {
    try {
      this.chess.load(fen);
      this.moveHistory = [];
      return true;
    } catch {
      return false;
    }
  }

  getBoard(): (string | null)[][] {
    const board: (string | null)[][] = [];
    for (let rank = 7; rank >= 0; rank--) {
      const row: (string | null)[] = [];
      for (let file = 0; file < 8; file++) {
        const square = String.fromCharCode(97 + file) + (rank + 1) as Square;
        const piece = this.chess.get(square);
        row.push(piece ? piece.type + (piece.color === 'w' ? '' : '') : null);
      }
      board.push(row);
    }
    return board;
  }

  getPieceAt(square: Square): Piece | null {
    return this.chess.get(square) ?? null;
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  reset(): void {
    this.chess.reset();
    this.moveHistory = [];
  }

  getPgn(): string {
    return this.chess.pgn();
  }

  loadPgn(pgn: string): boolean {
    try {
      this.chess.loadPgn(pgn);
      this.moveHistory = [];
      return true;
    } catch {
      return false;
    }
  }
}

export const createInitialGameState = (): GameState => {
  const game = new ChessGame();
  return {
    fen: game.getFen(),
    turn: game.getTurn(),
    moves: [],
    status: 'active',
  };
};