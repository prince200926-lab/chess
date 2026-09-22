import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, User, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ChatMessage, PlayerRole } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentPlayerId: string | undefined;
  onSendMessage: (content: string) => void;
}

export function ChatPanel({ messages, currentPlayerId, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const getRoleBadge = (role: PlayerRole) => {
    switch (role) {
      case 'teacher':
        return (
          <span className="px-1.5 py-0.5 text-xs bg-teacher/10 text-teacher rounded-full flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            Teacher
          </span>
        );
      case 'student':
        return (
          <span className="px-1.5 py-0.5 text-xs bg-student/10 text-student rounded-full flex items-center gap-1">
            <User className="w-3 h-3" />
            Student
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-gray-500" />
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-2 max-w-[85%]',
              message.playerId === currentPlayerId ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                message.playerId === currentPlayerId
                  ? 'bg-teacher text-white'
                  : 'bg-student text-white'
              )}
            >
              {message.playerRole === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
            </div>

            <div
              className={cn(
                'px-3 py-2 rounded-2xl max-w-full',
                message.playerId === currentPlayerId
                  ? 'bg-teacher text-white rounded-tr-none'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {message.playerId === currentPlayerId ? 'You' : message.playerName}
                </span>
                {getRoleBadge(message.playerRole)}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teacher"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 bg-teacher text-white rounded-full hover:bg-teacher/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}