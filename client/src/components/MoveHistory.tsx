import { cn } from '../lib/utils';
import type { Move } from '../types';

interface MoveHistoryProps {
  moves: Move[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  const groupedMoves: Array<{ moveNumber: number; white?: Move; black?: Move }> = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    groupedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="h-full overflow-y-auto p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Move History</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {moves.length} moves
        </span>
      </div>

      {groupedMoves.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p className="text-sm">No moves yet</p>
          <p className="text-xs mt-1">Game starts with White</p>
        </div>
      ) : (
        <div className="space-y-1">
          {groupedMoves.map((group, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-8 text-right text-gray-500 dark:text-gray-400 font-mono">
                {group.moveNumber}.
              </span>
              <button
                className={cn(
                  'flex-1 px-2 py-1 rounded text-left font-mono transition-colors',
                  'bg-teacher/10 text-teacher hover:bg-teacher/20'
                )}
              >
                {group.white?.san || ''}
              </button>
              <button
                className={cn(
                  'flex-1 px-2 py-1 rounded text-left font-mono transition-colors',
                  group.black
                    ? 'bg-student/10 text-student hover:bg-student/20'
                    : 'text-gray-300 dark:text-gray-600 cursor-default'
                )}
              >
                {group.black?.san || ''}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}