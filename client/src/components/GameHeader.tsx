import { useState } from 'react';
import { Crown, User, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Player, GameStatus } from '../types';

interface GameHeaderProps {
  roomCode: string;
  teacher: Player | null;
  student: Player | null;
  currentTurn: 'white' | 'black';
  gameStatus: GameStatus;
  playerColor: 'white' | 'black' | undefined;
}

export function GameHeader({
  roomCode,
  teacher,
  student,
  currentTurn,
  gameStatus,
  playerColor,
}: GameHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusText = (status: GameStatus) => {
    switch (status) {
      case 'waiting': return 'Waiting for player...';
      case 'active': return 'Game in progress';
      case 'check': return 'Check!';
      case 'checkmate': return 'Checkmate!';
      case 'stalemate': return 'Stalemate';
      case 'draw': return 'Draw';
      case 'resigned': return 'Resigned';
      case 'finished': return 'Game finished';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case 'check': return 'text-red-500';
      case 'checkmate': return 'text-red-600';
      case 'stalemate':
      case 'draw': return 'text-yellow-600';
      case 'resigned': return 'text-gray-600';
      case 'finished': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const isMyTurn = playerColor === currentTurn;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chess Tutor</h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{roomCode}</span>
            <button
              onClick={copyRoomCode}
              className="p-1 text-gray-500 hover:text-teacher transition-colors"
              aria-label="Copy room code"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              teacher?.connected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                teacher?.connected ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-teacher" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {teacher?.name || 'Teacher'}
                </span>
                {teacher?.color === currentTurn && (
                  <span className="text-xs bg-teacher text-white px-1.5 py-0.5 rounded">Turn</span>
                )}
              </div>
            </div>

            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              student?.connected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                student?.connected ? 'bg-green-500' : 'bg-gray-400'
              )} />
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-student" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {student?.name || 'Student'}
                </span>
                {student?.color === currentTurn && (
                  <span className="text-xs bg-student text-white px-1.5 py-0.5 rounded">Turn</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              isMyTurn ? 'bg-teacher/10 text-teacher' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}>
              {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
              {currentTurn === 'white' ? ' ♔' : ' ♚'}
            </div>

            <div className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium',
              getStatusColor(gameStatus)
            )}>
              {getStatusText(gameStatus)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}