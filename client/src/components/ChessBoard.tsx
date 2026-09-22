import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { X, RotateCcw } from 'lucide-react';
import { cn, coordsToSquare, getPieceSymbol, isLightSquare } from '../lib/utils';
import type { Move, SuggestedMove, PlayerColor, PlayerRole } from '../types';
import type { Square } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  turn: PlayerColor;
  playerColor: PlayerColor | undefined;
  role: PlayerRole | undefined;
  lastMove: Move | undefined;
  suggestion: SuggestedMove | null;
  gameStatus: string;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  onClearSuggestion: () => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export function ChessBoard({
  fen,
  turn,
  playerColor,
  role,
  lastMove,
  suggestion,
  gameStatus,
  onMove,
  onClearSuggestion,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  const [showPromotion, setShowPromotion] = useState<{ from: string; to: string } | null>(null);
  const [boardSize, setBoardSize] = useState(400);
  const boardRef = useRef<HTMLDivElement>(null);
  const chessRef = useRef(new Chess(fen));

  useEffect(() => {
    chessRef.current.load(fen);
  }, [fen]);

  useEffect(() => {
    const updateSize = () => {
      if (boardRef.current) {
        const containerWidth = boardRef.current.parentElement?.clientWidth || 400;
        const size = Math.min(containerWidth, 600);
        setBoardSize(size);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getLegalMovesForSquare = useCallback((square: string) => {
    const moves = chessRef.current.moves({ square: square as Square, verbose: true });
    return moves.map((m) => m.to);
  }, []);

  const handleSquareClick = useCallback((square: string) => {
    if (gameStatus !== 'active' && gameStatus !== 'check') return;
    if (role === 'student' && turn !== playerColor) return;
    if (role === 'teacher' && turn !== playerColor) return;

    const piece = chessRef.current.get(square as Square);

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare) {
      const isLegal = legalMoves.includes(square);
      if (isLegal) {
        const move = chessRef.current.move({ from: selectedSquare, to: square });
        if (move) {
          const promotion = move.promotion ? move.promotion : undefined;
          onMove({ from: selectedSquare, to: square, promotion });
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      }

      const newPiece = chessRef.current.get(square as Square);
      if (newPiece && newPiece.color === (turn === 'white' ? 'w' : 'b')) {
        setSelectedSquare(square);
        setLegalMoves(getLegalMovesForSquare(square));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    } else if (piece && piece.color === (turn === 'white' ? 'w' : 'b')) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMovesForSquare(square));
    }
  }, [selectedSquare, legalMoves, turn, playerColor, role, gameStatus, getLegalMovesForSquare, onMove]);

  const handleDragStart = useCallback((e: React.DragEvent, square: string, piece: string) => {
    if (gameStatus !== 'active' && gameStatus !== 'check') return;
    if (role === 'student' && turn !== playerColor) return;
    if (role === 'teacher' && turn !== playerColor) return;

    const pieceData = chessRef.current.get(square as Square);
    if (!pieceData || pieceData.color !== (turn === 'white' ? 'w' : 'b')) return;

    setIsDragging(true);
    setDraggedPiece(piece);
    setDraggedFrom(square);
    setSelectedSquare(square);
    setLegalMoves(getLegalMovesForSquare(square));
    e.dataTransfer.effectAllowed = 'move';
  }, [turn, playerColor, role, gameStatus, getLegalMovesForSquare]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, square: string) => {
    e.preventDefault();
    if (!draggedFrom || draggedFrom === square) {
      setIsDragging(false);
      setDraggedPiece(null);
      setDraggedFrom(null);
      return;
    }

    const isLegal = legalMoves.includes(square);
    if (isLegal) {
      const move = chessRef.current.move({ from: draggedFrom, to: square });
      if (move) {
        const promotion = move.promotion ? move.promotion : undefined;
        onMove({ from: draggedFrom, to: square, promotion });
      }
    }

    setIsDragging(false);
    setDraggedPiece(null);
    setDraggedFrom(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [draggedFrom, legalMoves, onMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setDragPosition({
        x: e.clientX - rect.left - boardSize / 16,
        y: e.clientY - rect.top - boardSize / 16,
      });
    }
  }, [isDragging, boardSize]);

  const handlePromotionSelect = useCallback((promotion: string) => {
    if (showPromotion) {
      onMove({ from: showPromotion.from, to: showPromotion.to, promotion });
      setShowPromotion(null);
    }
  }, [showPromotion, onMove]);

  const squareSize = boardSize / 8;

  const renderSquare = (file: number, rank: number) => {
    const square = coordsToSquare(file, rank);
    const isLight = isLightSquare(file, rank);
    const isSelected = selectedSquare === square;
    const isLegal = legalMoves.includes(square);
    const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
    const isCheck = gameStatus === 'check' && !chessRef.current.isCheckmate();

    const piece = chessRef.current.get(square as Square);
    const pieceSymbol = piece ? getPieceSymbol(piece.type + (piece.color === 'w' ? '' : '')) : null;

    const isSuggestionFrom = suggestion?.from === square;
    const isSuggestionTo = suggestion?.to === square;

    return (
      <div
        key={square}
        className={cn(
          'board-square',
          isLight ? 'light' : 'dark',
          isSelected && 'selected',
          isLegal && 'legal-move',
          isLastMove && 'last-move',
          isCheck && 'check'
        )}
        style={{
          width: squareSize,
          height: squareSize,
        }}
        onClick={() => handleSquareClick(square)}
        onDragStart={(e) => handleDragStart(e, square, pieceSymbol || '')}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, square)}
        onMouseMove={handleMouseMove}
      >
        {isSuggestionFrom && (
          <div className="suggestion-highlight rounded-[2px]" style={{ boxShadow: 'inset 0 0 0 3px #f59e0b' }} />
        )}
        {isSuggestionTo && (
          <div className="suggestion-highlight rounded-full" style={{ boxShadow: 'inset 0 0 0 3px #f59e0b' }} />
        )}
        {pieceSymbol && piece && !isDragging && (
          <span
            className={cn(
              'text-4xl select-none transition-transform duration-100',
              piece.color === 'w' ? 'text-piece-white drop-shadow-lg' : 'text-piece-black drop-shadow-lg'
            )}
          >
            {pieceSymbol}
          </span>
        )}
        {isLegal && !pieceSymbol && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-teacher/40" />
          </div>
        )}
      </div>
    );
  };

  const renderCoordinates = () => (
    <>
      <div className="flex items-center justify-between h-6 px-2 text-xs text-gray-500 dark:text-gray-400">
        {FILES.map((file) => (
          <div key={file} className="w-1/8 text-center" style={{ width: squareSize }}>
            {file}
          </div>
        ))}
      </div>
      <div className="flex flex-col h-full justify-between px-2 text-xs text-gray-500 dark:text-gray-400">
        {RANKS.map((rank) => (
          <div key={rank} className="h-1/8 flex items-center" style={{ height: squareSize }}>
            {rank}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" ref={boardRef}>
        <div className="flex">
          {renderCoordinates()}
          <div className="relative" style={{ width: boardSize, height: boardSize }}>
            <div
              className="grid grid-cols-8 grid-rows-8"
              style={{
                width: boardSize,
                height: boardSize,
                transform: playerColor === 'black' ? 'rotate(180deg)' : 'none',
              }}
            >
              {RANKS.map((rank) =>
                FILES.map((_, fileIndex) =>
                  renderSquare(fileIndex, 8 - rank)
                )
              )}
            </div>

            {suggestion && suggestion.from && suggestion.to && (
              <svg
                className="absolute inset-0 pointer-events-none suggestion-arrow"
                style={{ width: boardSize, height: boardSize }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                  </marker>
                </defs>
                <line
                  x1={(FILES.indexOf(suggestion.from[0]) + 0.5) * squareSize}
                  y1={(8 - parseInt(suggestion.from[1]) + 0.5) * squareSize}
                  x2={(FILES.indexOf(suggestion.to[0]) + 0.5) * squareSize}
                  y2={(8 - parseInt(suggestion.to[1]) + 0.5) * squareSize}
                  stroke="#f59e0b"
                  strokeWidth="4"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="8,4"
                />
              </svg>
            )}

            {isDragging && draggedPiece && (
              <div
                className="absolute pointer-events-none z-50 text-4xl select-none transition-transform duration-50"
                style={{
                  left: dragPosition.x,
                  top: dragPosition.y,
                  transform: playerColor === 'black' ? 'rotate(180deg)' : 'none',
                  transformOrigin: 'center center',
                }}
              >
                {draggedPiece}
              </div>
            )}
          </div>
          {renderCoordinates()}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => {
            chessRef.current.load(fen);
          }}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Flip board"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {turn === 'white' ? '♔' : '♚'} {turn}'s turn
        </div>
        {suggestion && (
          <button
            onClick={onClearSuggestion}
            className="px-3 py-1 text-xs bg-suggestion/10 text-suggestion rounded-lg hover:bg-suggestion/20 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear suggestion
          </button>
        )}
      </div>

      {showPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex gap-2">
            {['q', 'r', 'b', 'n'].map((piece) => (
              <button
                key={piece}
                onClick={() => handlePromotionSelect(piece)}
                className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-2xl"
              >
                {getPieceSymbol((turn === 'white' ? '' : '') + piece.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}