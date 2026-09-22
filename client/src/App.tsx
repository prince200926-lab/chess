import { useState, useEffect, useCallback } from 'react';
import { ChessBoard } from './components/ChessBoard';
import { ChatPanel } from './components/ChatPanel';
import { MoveHistory } from './components/MoveHistory';
import { TeacherControls } from './components/TeacherControls';
import { SuggestionPanel } from './components/SuggestionPanel';
import { RoomLobby } from './components/RoomLobby';
import { GameHeader } from './components/GameHeader';
import { useGameStore } from './store/gameStore';
import { connectSocket, disconnectSocket } from './lib/socket';
import type { Room, Player, GameState, Move, SuggestedMove, ChatMessage, GameStatus, PlayerRole, PlayerColor } from './types';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [showLobby, setShowLobby] = useState(true);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const {
    roomState,
    player,
    setRoomState,
    setPlayer,
    resetGame,
  } = useGameStore();

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('roomCreated', (room: Room, playerData: Player) => {
      setPlayer(playerData);
      setCreatedRoomCode(room.code);
      setRoomState({
        room,
        game: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'white',
          moves: [],
          status: 'active',
        },
        suggestion: null,
        chat: [],
        history: [],
      });
      // Keep lobby open to show room code
    });

    socket.on('roomJoined', (roomStateData: { room: Room; game: GameState; suggestion: SuggestedMove | null; chat: ChatMessage[]; history: Move[] }, playerData: Player) => {
      setPlayer(playerData);
      setRoomState(roomStateData);
      setCreatedRoomCode(null);
      setShowLobby(false);
    });

    socket.on('roomError', (error: string) => {
      alert(error);
    });

    socket.on('gameStateUpdate', (game: GameState) => {
      useGameStore.getState().updateGame(game);
    });

    socket.on('moveMade', (move: Move) => {
      useGameStore.getState().addMove(move);
    });

    socket.on('takebackPerformed', (game: GameState, steps: number) => {
      useGameStore.getState().performTakeback(game, steps);
    });

    socket.on('redoPerformed', (game: GameState, steps: number) => {
      useGameStore.getState().performRedo(game, steps);
    });

    socket.on('suggestionUpdate', (suggestion: SuggestedMove | null) => {
      useGameStore.getState().setSuggestion(suggestion);
    });

    socket.on('suggestionAccepted', (move: Move) => {
      useGameStore.getState().acceptSuggestion(move);
    });

    socket.on('suggestionRejected', () => {
      useGameStore.getState().rejectSuggestion();
    });

    socket.on('chatMessage', (message: ChatMessage) => {
      useGameStore.getState().addChatMessage(message);
    });

    socket.on('playerConnected', (playerData: Player) => {
      useGameStore.getState().updatePlayerConnection(playerData.id, true);
    });

    socket.on('playerDisconnected', (playerId: string) => {
      useGameStore.getState().updatePlayerConnection(playerId, false);
    });

    socket.on('gameStatusUpdate', (status: GameStatus, winner?: PlayerColor, drawReason?: string) => {
      useGameStore.getState().updateGameStatus(status, winner, drawReason);
    });

    socket.on('gameRestarted', (game: GameState) => {
      useGameStore.getState().restartGame(game);
    });

    socket.on('playerRoleUpdate', (role: PlayerRole, color: PlayerColor) => {
      useGameStore.getState().updatePlayerRole(role, color);
    });

    socket.on('roomClosed', () => {
      resetGame();
      setCreatedRoomCode(null);
      setShowLobby(true);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('roomError');
      socket.off('gameStateUpdate');
      socket.off('moveMade');
      socket.off('takebackPerformed');
      socket.off('redoPerformed');
      socket.off('suggestionUpdate');
      socket.off('suggestionAccepted');
      socket.off('suggestionRejected');
      socket.off('chatMessage');
      socket.off('playerConnected');
      socket.off('playerDisconnected');
      socket.off('gameStatusUpdate');
      socket.off('gameRestarted');
      socket.off('playerRoleUpdate');
      socket.off('roomClosed');
      disconnectSocket();
    };
  }, [setRoomState, setPlayer, resetGame]);

  const handleCreateRoom = useCallback((name: string) => {
    const socket = connectSocket();
    socket.emit('createRoom', name);
  }, []);

  const handleJoinRoom = useCallback((code: string, name: string) => {
    const socket = connectSocket();
    socket.emit('joinRoom', code, name);
  }, []);

  if (showLobby) {
    return (
      <RoomLobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        isConnected={isConnected}
        createdRoomCode={createdRoomCode}
      />
    );
  }

  if (!roomState) {
    return <RoomLobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} isConnected={isConnected} createdRoomCode={null} />;
  }

  const isTeacher = player?.role === 'teacher';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        <GameHeader
          roomCode={roomState.room.code}
          teacher={roomState.room.teacher}
          student={roomState.room.student}
          currentTurn={roomState.game.turn}
          gameStatus={roomState.game.status}
          playerColor={player?.color}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <ChessBoard
              fen={roomState.game.fen}
              turn={roomState.game.turn}
              playerColor={player?.color}
              role={player?.role}
              lastMove={roomState.game.moves[roomState.game.moves.length - 1]}
              suggestion={roomState.suggestion}
              gameStatus={roomState.game.status}
              onMove={(move) => {
                const socket = connectSocket();
                socket.emit('makeMove', move);
              }}
              onClearSuggestion={() => {
                const socket = connectSocket();
                socket.emit('clearSuggestion');
              }}
            />

            <div className="flex-1 flex min-h-0 md:hidden">
              <div className="w-full flex-1 overflow-hidden">
                <MoveHistory moves={roomState.game.moves} />
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col w-80 min-w-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex-1 overflow-hidden">
              <MoveHistory moves={roomState.game.moves} />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              {isTeacher ? (
                <SuggestionPanel
                  suggestion={roomState.suggestion}
                  onSuggestMove={(suggestion) => {
                    const socket = connectSocket();
                    socket.emit('suggestMove', suggestion);
                  }}
                  onClearSuggestion={() => {
                    const socket = connectSocket();
                    socket.emit('clearSuggestion');
                  }}
                />
              ) : (
                <SuggestionPanel
                  suggestion={roomState.suggestion}
                  isStudentView
                  onAccept={() => {
                    const socket = connectSocket();
                    socket.emit('acceptSuggestion');
                  }}
                  onReject={() => {
                    const socket = connectSocket();
                    socket.emit('rejectSuggestion');
                  }}
                />
              )}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 flex-1 min-h-[200px]">
              <ChatPanel
                messages={roomState.chat}
                currentPlayerId={player?.id}
                onSendMessage={(content) => {
                  const socket = connectSocket();
                  socket.emit('sendChatMessage', content);
                }}
              />
            </div>
          </div>
        </div>

        {isTeacher && (
          <TeacherControls
            onTakeback={(steps) => {
              const socket = connectSocket();
              socket.emit('requestTakeback', steps);
            }}
            onRedo={(steps) => {
              const socket = connectSocket();
              socket.emit('requestRedo', steps);
            }}
            onRestart={() => {
              const socket = connectSocket();
              socket.emit('restartGame');
            }}
            onResign={() => {
              const socket = connectSocket();
              socket.emit('resign');
            }}
            onOfferDraw={() => {
              const socket = connectSocket();
              socket.emit('offerDraw');
            }}
            moveCount={roomState.game.moves.length}
            canRedo={roomState.game.moves.length > 0}
          />
        )}
      </div>
    </div>
  );
}

export default App;