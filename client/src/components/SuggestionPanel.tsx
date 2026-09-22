import { Lightbulb, X, Check, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { SuggestedMove } from '../types';

interface SuggestionPanelProps {
  suggestion: SuggestedMove | null;
  isStudentView?: boolean;
  onSuggestMove?: (suggestion: { from: string; to: string; san: string; explanation?: string }) => void;
  onClearSuggestion?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export function SuggestionPanel({
  suggestion,
  isStudentView = false,
  onSuggestMove,
  onClearSuggestion,
  onAccept,
  onReject,
}: SuggestionPanelProps) {
  if (!suggestion && !isStudentView) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800">
        <button
          onClick={() => onSuggestMove?.({ from: '', to: '', san: '', explanation: '' })}
          className="w-full px-4 py-3 bg-teacher/10 text-teacher rounded-lg hover:bg-teacher/20 transition-colors flex items-center justify-center gap-2"
        >
          <Lightbulb className="w-5 h-5" />
          <span className="font-medium">Suggest a Move</span>
        </button>
      </div>
    );
  }

  if (!suggestion && isStudentView) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 text-center text-gray-500 dark:text-gray-400">
        <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No suggestion from teacher</p>
      </div>
    );
  }

  if (!suggestion) return null;

  const isAccepted = suggestion.accepted;
  const isRejected = suggestion.rejected;

  if (isStudentView) {
    return (
      <div className={cn('p-4 bg-white dark:bg-gray-800 animate-slide-in', isAccepted && 'bg-green-50 dark:bg-green-900/20', isRejected && 'bg-red-50 dark:bg-red-900/20')}>
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            isAccepted ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
            isRejected ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
            'bg-suggestion/10 text-suggestion'
          )}>
            <Lightbulb className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Teacher suggests: <strong className="font-mono text-lg">{suggestion.san}</strong>
              </span>
              {isAccepted && <Check className="w-4 h-4 text-green-500" />}
              {isRejected && <X className="w-4 h-4 text-red-500" />}
            </div>

            {suggestion.explanation && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                "{suggestion.explanation}"
              </p>
            )}

            {!isAccepted && !isRejected && (
              <div className="flex gap-2">
                <button
                  onClick={onAccept}
                  className="flex-1 px-3 py-2 bg-student text-white rounded-lg hover:bg-student/90 transition-colors font-medium flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Play this move
                </button>
                <button
                  onClick={onReject}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Ignore
                </button>
              </div>
            )}

            {isAccepted && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                You played the suggested move!
              </p>
            )}

            {isRejected && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Suggestion dismissed. Make your own move.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 animate-slide-in">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-suggestion" />
        <span className="font-medium text-gray-900 dark:text-gray-100">Current Suggestion</span>
        {suggestion.accepted && <Check className="w-4 h-4 text-green-500 ml-auto" />}
        {suggestion.rejected && <X className="w-4 h-4 text-red-500 ml-auto" />}
      </div>

      <div className="mb-3 p-3 bg-suggestion/10 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg font-mono font-bold text-suggestion">{suggestion.san}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {suggestion.from} → {suggestion.to}
          </span>
        </div>
        {suggestion.explanation && (
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            "{suggestion.explanation}"
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClearSuggestion}
          className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-1"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
        <button
          onClick={() => onSuggestMove?.({ from: '', to: '', san: '', explanation: '' })}
          className="flex-1 px-3 py-2 bg-teacher text-white rounded-lg hover:bg-teacher/90 transition-colors font-medium flex items-center justify-center gap-1"
        >
          <ArrowRight className="w-4 h-4" />
          New Suggestion
        </button>
      </div>
    </div>
  );
}