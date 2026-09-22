import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import type {
  Room,
  Player,
  Move,
  GameState,
  SuggestedMove,
  ChatMessage,
  PlayerRole,
  PlayerColor,
  GameStatus,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const app = express();
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

interface RoomData {
  room: Room;
  game: Chess;
  gameState: GameState;
  suggestion: SuggestedMove | null;
  chat: ChatMessage[];
  moveHistory: Move[];
  redoStack: Move[];
}

const rooms = new Map<string, RoomData>();
const playerSockets = new Map<string, string>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createInitialGameState(): GameState {
  const chess = new Chess();
  return {
    fen: chess.fen(),
    turn: 'white',
    moves: [],
    status: 'active',
  };
}

function updateGameState(chess: Chess, moves: Move[]): GameState {
  const status: GameStatus = chess.isCheckmate() ? 'checkmate' :
    chess.isStalemate() ? 'stalemate' :
    chess.isDraw() ? 'draw' :
    chess.isCheck() ? 'check' : 'active';

  let winner: PlayerColor | undefined;
  let drawReason: string | undefined;

  if (chess.isCheckmate()) {
    winner = chess.turn() === 'w' ? 'black' : 'white';
  } else if (chess.isStalemate()) {
    drawReason = 'stalemate';
  } else if (chess.isThreefoldRepetition()) {
    drawReason = 'threefold_repetition';
  } else if (chess.isInsufficientMaterial()) {
    drawReason = 'insufficient_material';
  } else if (chess.isDraw()) {
    drawReason = 'draw';
  }

  return {
    fen: chess.fen(),
    turn: chess.turn() === 'w' ? 'white' : 'black',
    moves,
    status,
    winner,
    drawReason,
  };
}

function broadcastToRoom(roomId: string, event: keyof ServerToClientEvents, ...args: any[]) {
  io.to(roomId).emit(event as any, ...args);
}

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('createRoom', (playerName: string) => {
    try {
      const roomCode = generateRoomCode();
      const roomId = uuidv4();
      const playerId = uuidv4();

      const player: Player = {
        id: playerId,
        name: playerName,
        role: 'teacher',
        color: 'white',
        connected: true,
      };

      const room: Room = {
        id: roomId,
        code: roomCode,
        teacher: player,
        student: null,
        status: 'waiting',
        createdAt: Date.now(),
      };

      const chess = new Chess();
      const gameState = createInitialGameState();

      const roomData: RoomData = {
        room,
        game: chess,
        gameState,
        suggestion: null,
        chat: [],
        moveHistory: [],
        redoStack: [],
      };

      rooms.set(roomId, roomData);
      playerSockets.set(playerId, socket.id);

      socket.data.playerId = playerId;
      socket.data.roomId = roomId;
      socket.data.role = 'teacher';

      socket.join(roomId);

      socket.emit('roomCreated', room, player);
      console.log(`Room created: ${roomCode} by ${playerName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('roomError', 'Failed to create room');
    }
  });

  socket.on('joinRoom', (roomCode: string, playerName: string) => {
    try {
      const roomEntry = Array.from(rooms.entries()).find(([, data]) => data.room.code === roomCode.toUpperCase());

      if (!roomEntry) {
        socket.emit('roomError', 'Room not found');
        return;
      }

      const [roomId, roomData] = roomEntry;

      if (roomData.room.student) {
        socket.emit('roomError', 'Room is full');
        return;
      }

      const playerId = uuidv4();
      const player: Player = {
        id: playerId,
        name: playerName,
        role: 'student',
        color: 'black',
        connected: true,
      };

      roomData.room.student = player;
      roomData.room.status = 'active';
      playerSockets.set(playerId, socket.id);

      socket.data.playerId = playerId;
      socket.data.roomId = roomId;
      socket.data.role = 'student';

      socket.join(roomId);

      const roomState = {
        room: roomData.room,
        game: roomData.gameState,
        suggestion: roomData.suggestion,
        chat: roomData.chat,
        history: roomData.moveHistory,
      };

      socket.emit('roomJoined', roomState, player);
      socket.to(roomId).emit('playerConnected', player);

      console.log(`Player ${playerName} joined room ${roomCode} as student`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('roomError', 'Failed to join room');
    }
  });

  socket.on('makeMove', (moveData: { from: string; to: string; promotion?: string }) => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    const role = socket.data.role;

    if (!roomId || !playerId) return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    const player = role === 'teacher' ? roomData.room.teacher : roomData.room.student;
    if (!player || player.id !== playerId) return;

    const currentTurn = roomData.game.turn() === 'w' ? 'white' : 'black';
    if (player.color !== currentTurn) return;

    if (roomData.gameState.status !== 'active' && roomData.gameState.status !== 'check') return;

    try {
      const move = roomData.game.move({
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion,
      });

      if (!move) return;

      const moveObj: Move = {
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion as Move['promotion'],
        san: move.san,
        fen: roomData.game.fen(),
        timestamp: Date.now(),
        playerId,
      };

      roomData.moveHistory.push(moveObj);
      roomData.redoStack = [];
      roomData.suggestion = null;
      roomData.gameState = updateGameState(roomData.game, roomData.moveHistory);

      broadcastToRoom(roomId, 'moveMade', moveObj);
      broadcastToRoom(roomId, 'gameStateUpdate', roomData.gameState);
      broadcastToRoom(roomId, 'suggestionUpdate', null);

      if (roomData.gameState.status !== 'active') {
        broadcastToRoom(roomId, 'gameStatusUpdate', roomData.gameState.status, roomData.gameState.winner, roomData.gameState.drawReason);
      }
    } catch (error) {
      console.error('Error making move:', error);
    }
  });

  socket.on('requestTakeback', (steps = 1) => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    if (!roomId || role !== 'teacher') return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    if (roomData.moveHistory.length < steps) return;

    const undoneMoves = roomData.moveHistory.splice(-steps);
    roomData.redoStack.push(...undoneMoves.reverse());

    for (let i = 0; i < steps; i++) {
      roomData.game.undo();
    }

    roomData.suggestion = null;
    roomData.gameState = updateGameState(roomData.game, roomData.moveHistory);

    broadcastToRoom(roomId, 'takebackPerformed', roomData.gameState, steps);
    broadcastToRoom(roomId, 'gameStateUpdate', roomData.gameState);
    broadcastToRoom(roomId, 'suggestionUpdate', null);
  });

  socket.on('requestRedo', (steps = 1) => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    if (!roomId || role !== 'teacher') return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    if (roomData.redoStack.length < steps) return;

    const redoneMoves = roomData.redoStack.splice(-steps).reverse();

    for (const move of redoneMoves) {
      roomData.game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });
      roomData.moveHistory.push(move);
    }

    roomData.suggestion = null;
    roomData.gameState = updateGameState(roomData.game, roomData.moveHistory);

    broadcastToRoom(roomId, 'redoPerformed', roomData.gameState, steps);
    broadcastToRoom(roomId, 'gameStateUpdate', roomData.gameState);
    broadcastToRoom(roomId, 'suggestionUpdate', null);
  });

  socket.on('suggestMove', (suggestionData: { from: string; to: string; san: string; explanation?: string }) => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    const role = socket.data.role;

    if (!roomId || role !== 'teacher') return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    const suggestion: SuggestedMove = {
      from: suggestionData.from,
      to: suggestionData.to,
      san: suggestionData.san,
      explanation: suggestionData.explanation,
      suggestedBy: playerId,
      timestamp: Date.now(),
    };

    roomData.suggestion = suggestion;
    broadcastToRoom(roomId, 'suggestionUpdate', suggestion);
  });

  socket.on('clearSuggestion', () => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    if (!roomId || role !== 'teacher') return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    roomData.suggestion = null;
    broadcastToRoom(roomId, 'suggestionUpdate', null);
  });

  socket.on('acceptSuggestion', () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    const role = socket.data.role;

    if (!roomId || role !== 'student') return;

    const roomData = rooms.get(roomId);
    if (!roomData || !roomData.suggestion) return;

    const suggestion = roomData.suggestion;
    const currentTurn = roomData.game.turn() === 'w' ? 'white' : 'black';

    const student = roomData.room.student;
    if (!student || student.id !== playerId || student.color !== currentTurn) return;

    try {
      const move = roomData.game.move({
        from: suggestion.from,
        to: suggestion.to,
      });

      if (!move) return;

      const moveObj: Move = {
        from: suggestion.from,
        to: suggestion.to,
        san: move.san,
        fen: roomData.game.fen(),
        timestamp: Date.now(),
        playerId,
      };

      roomData.moveHistory.push(moveObj);
      roomData.redoStack = [];
      roomData.suggestion = { ...suggestion, accepted: true };
      roomData.gameState = updateGameState(roomData.game, roomData.moveHistory);

      broadcastToRoom(roomId, 'suggestionAccepted', moveObj);
      broadcastToRoom(roomId, 'moveMade', moveObj);
      broadcastToRoom(roomId, 'gameStateUpdate', roomData.gameState);

      if (roomData.gameState.status !== 'active') {
        broadcastToRoom(roomId, 'gameStatusUpdate', roomData.gameState.status, roomData.gameState.winner, roomData.gameState.drawReason);
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  });

  socket.on('rejectSuggestion', () => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    if (!roomId || role !== 'student') return;

    const roomData = rooms.get(roomId);
    if (!roomData || !roomData.suggestion) return;

    roomData.suggestion = { ...roomData.suggestion, rejected: true };
    broadcastToRoom(roomId, 'suggestionRejected');
    broadcastToRoom(roomId, 'suggestionUpdate', roomData.suggestion);
  });

  socket.on('sendChatMessage', (content: string) => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    const role = socket.data.role;

    if (!roomId || !playerId) return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    const player = role === 'teacher' ? roomData.room.teacher : roomData.room.student;
    if (!player) return;

    const message: ChatMessage = {
      id: uuidv4(),
      playerId,
      playerName: player.name,
      playerRole: role,
      content,
      timestamp: Date.now(),
    };

    roomData.chat.push(message);
    broadcastToRoom(roomId, 'chatMessage', message);
  });

  socket.on('restartGame', () => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    if (!roomId || role !== 'teacher') return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    roomData.game.reset();
    roomData.moveHistory = [];
    roomData.redoStack = [];
    roomData.suggestion = null;
    roomData.gameState = createInitialGameState();

    broadcastToRoom(roomId, 'gameRestarted', roomData.gameState);
    broadcastToRoom(roomId, 'gameStateUpdate', roomData.gameState);
    broadcastToRoom(roomId, 'suggestionUpdate', null);
  });

  socket.on('resign', () => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    if (!roomId || role !== 'teacher') return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    roomData.gameState.status = 'resigned';
    roomData.gameState.winner = roomData.game.turn() === 'w' ? 'black' : 'white';

    broadcastToRoom(roomId, 'gameStatusUpdate', 'resigned', roomData.gameState.winner);
  });

  socket.on('offerDraw', () => {
    const roomId = socket.data.roomId;
    const role = socket.data.role;

    if (!roomId || role !== 'teacher') return;

    const roomData = rooms.get(roomId);
    if (!roomData) return;

    roomData.gameState.status = 'draw';
    roomData.gameState.drawReason = 'agreed';

    broadcastToRoom(roomId, 'gameStatusUpdate', 'draw', undefined, 'agreed');
  });

  socket.on('reconnect', (roomCode: string, playerId: string) => {
    const roomEntry = Array.from(rooms.entries()).find(([, data]) => data.room.code === roomCode.toUpperCase());

    if (!roomEntry) {
      socket.emit('roomError', 'Room not found');
      return;
    }

    const [roomId, roomData] = roomEntry;

    const player = roomData.room.teacher?.id === playerId ? roomData.room.teacher :
      roomData.room.student?.id === playerId ? roomData.room.student : null;

    if (!player) {
      socket.emit('roomError', 'Player not found in room');
      return;
    }

    player.connected = true;
    playerSockets.set(playerId, socket.id);

    socket.data.playerId = playerId;
    socket.data.roomId = roomId;
    socket.data.role = player.role;

    socket.join(roomId);

    const roomState = {
      room: roomData.room,
      game: roomData.gameState,
      suggestion: roomData.suggestion,
      chat: roomData.chat,
      history: roomData.moveHistory,
    };

    socket.emit('roomJoined', roomState, player);
    socket.to(roomId).emit('playerConnected', player);
  });

  socket.on('disconnect', () => {
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;

    if (playerId && roomId) {
      const roomData = rooms.get(roomId);
      if (roomData) {
        const player = roomData.room.teacher?.id === playerId ? roomData.room.teacher :
          roomData.room.student?.id === playerId ? roomData.room.student : null;

        if (player) {
          player.connected = false;
          socket.to(roomId).emit('playerDisconnected', playerId);
        }

        if (!roomData.room.teacher?.connected && !roomData.room.student?.connected) {
          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (currentRoom && !currentRoom.room.teacher?.connected && !currentRoom.room.student?.connected) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} cleaned up`);
            }
          }, 60000);
        }
      }
      playerSockets.delete(playerId);
    }

    console.log(`Player disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});