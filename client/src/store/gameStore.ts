import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoomState, Player, Move, GameState, SuggestedMove, ChatMessage, PlayerRole, PlayerColor } from '../types';

interface GameStore {
  roomState: RoomState | null;
  player: Player | null;
  boardFlipped: boolean;
  setRoomState: (state: RoomState) => void;
  setPlayer: (player: Player) => void;
  updateGame: (game: GameState) => void;
  addMove: (move: Move) => void;
  performTakeback: (game: GameState, steps: number) => void;
  performRedo: (game: GameState, steps: number) => void;
  setSuggestion: (suggestion: SuggestedMove | null) => void;
  acceptSuggestion: (move: Move) => void;
  rejectSuggestion: () => void;
  addChatMessage: (message: ChatMessage) => void;
  updatePlayerConnection: (playerId: string, connected: boolean) => void;
  updateGameStatus: (status: GameState['status'], winner?: PlayerColor, drawReason?: string) => void;
  restartGame: (game: GameState) => void;
  updatePlayerRole: (role: PlayerRole, color: PlayerColor) => void;
  toggleBoardFlip: () => void;
  setBoardFlipped: (flipped: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      roomState: null,
      player: null,
      boardFlipped: false,

      setRoomState: (roomState: RoomState) => set({ roomState }),

      setPlayer: (player: Player) => set({ player }),

      updateGame: (game: GameState) =>
        set((state: GameStore) => ({
          roomState: state.roomState ? { ...state.roomState, game } : null,
        })),

      addMove: (move: Move) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                game: {
                  ...state.roomState.game,
                  moves: [...state.roomState.game.moves, move],
                  fen: move.fen,
                  turn: move.san.includes('+') || move.san.includes('#') 
                    ? (state.roomState.game.turn === 'white' ? 'black' : 'white')
                    : (state.roomState.game.turn === 'white' ? 'black' : 'white'),
                  status: 'active',
                },
                history: [...state.roomState.history, move],
                suggestion: null,
              }
            : null,
        })),

      performTakeback: (game: GameState, steps: number) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                game,
                history: state.roomState.history.slice(0, -steps),
                suggestion: null,
              }
            : null,
        })),

      performRedo: (game: GameState, _steps: number) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                game,
                suggestion: null,
              }
            : null,
        })),

      setSuggestion: (suggestion: SuggestedMove | null) =>
        set((state: GameStore) => ({
          roomState: state.roomState ? { ...state.roomState, suggestion } : null,
        })),

      acceptSuggestion: (move: Move) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                game: {
                  ...state.roomState.game,
                  moves: [...state.roomState.game.moves, move],
                  fen: move.fen,
                  turn: state.roomState.game.turn === 'white' ? 'black' : 'white',
                },
                suggestion: state.roomState.suggestion
                  ? { ...state.roomState.suggestion, accepted: true }
                  : null,
              }
            : null,
        })),

      rejectSuggestion: () =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                suggestion: state.roomState.suggestion
                  ? { ...state.roomState.suggestion, rejected: true }
                  : null,
              }
            : null,
        })),

      addChatMessage: (message: ChatMessage) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? { ...state.roomState, chat: [...state.roomState.chat, message] }
            : null,
        })),

      updatePlayerConnection: (playerId: string, connected: boolean) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                room: {
                  ...state.roomState.room,
                  teacher: state.roomState.room.teacher?.id === playerId
                    ? { ...state.roomState.room.teacher!, connected }
                    : state.roomState.room.teacher,
                  student: state.roomState.room.student?.id === playerId
                    ? { ...state.roomState.room.student!, connected }
                    : state.roomState.room.student,
                },
              }
            : null,
        })),

      updateGameStatus: (status: GameState['status'], winner?: PlayerColor, drawReason?: string) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                game: {
                  ...state.roomState.game,
                  status,
                  winner,
                  drawReason,
                },
              }
            : null,
        })),

      restartGame: (game: GameState) =>
        set((state: GameStore) => ({
          roomState: state.roomState
            ? {
                ...state.roomState,
                game,
                history: [],
                suggestion: null,
                chat: [],
              }
            : null,
        })),

      updatePlayerRole: (role: PlayerRole, color: PlayerColor) =>
        set((state: GameStore) => ({
          player: state.player ? { ...state.player, role, color } : null,
        })),

      toggleBoardFlip: () =>
        set((state: GameStore) => ({ boardFlipped: !state.boardFlipped })),

      setBoardFlipped: (flipped: boolean) => set({ boardFlipped: flipped }),

      resetGame: () => set({ roomState: null, player: null, boardFlipped: false }),
    }),
    {
      name: 'chess-tutor-storage',
      partialize: (state: GameStore) => ({ boardFlipped: state.boardFlipped }),
    }
  )
);