import { RotateCcw, Undo2, Redo2, Flag, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface TeacherControlsProps {
  onTakeback: (steps: number) => void;
  onRedo: (steps: number) => void;
  onRestart: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  moveCount: number;
  canRedo: boolean;
}

export function TeacherControls({
  onTakeback,
  onRedo,
  onRestart,
  onResign,
  onOfferDraw,
  moveCount,
  canRedo,
}: TeacherControlsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs bg-teacher/10 text-teacher rounded-full">Teaching Controls</span>
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Game Controls
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTakeback(1)}
              disabled={moveCount === 0}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Undo2 className="w-4 h-4" />
              Take Back
            </button>

            <button
              onClick={() => onTakeback(2)}
              disabled={moveCount < 2}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Undo2 className="w-4 h-4" />
              <Undo2 className="w-4 h-4" />
              Take Back 2
            </button>

            <button
              onClick={() => onRedo(1)}
              disabled={!canRedo}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Redo2 className="w-4 h-4" />
              Redo
            </button>

            <button
              onClick={onRestart}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Game Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onOfferDraw}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
              )}
            >
              <HelpCircle className="w-4 h-4" />
              Offer Draw
            </button>

            <button
              onClick={onResign}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1',
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
              )}
            >
              <Flag className="w-4 h-4" />
              Resign
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Teaching Tools
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p className="flex items-center gap-1">
              <span className="w-4 h-4 bg-teacher/20 rounded" />
              Yellow arrow = suggested move
            </p>
            <p className="flex items-center gap-1">
              <span className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded border" />
              Gray circle = legal move
            </p>
            <p className="flex items-center gap-1">
              <span className="w-4 h-4 bg-teacher/20 rounded border-2 border-teacher" />
              Blue border = selected square
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}