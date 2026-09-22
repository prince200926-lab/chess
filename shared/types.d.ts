export type PlayerRole = 'teacher' | 'student' | 'spectator';
export type GameStatus = 'waiting' | 'active' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'finished';
export type PlayerColor = 'white' | 'black';
export interface Piece {
    type: string;
    color: 'w' | 'b';
}
export interface Player {
    id: string;
    name: string;
    role: PlayerRole;
    color: PlayerColor;
    connected: boolean;
}
export interface Room {
    id: string;
    code: string;
    teacher: Player | null;
    student: Player | null;
    status: GameStatus;
    createdAt: number;
}
export interface Move {
    from: string;
    to: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
    san: string;
    fen: string;
    timestamp: number;
    playerId: string;
}
export interface SuggestedMove {
    from: string;
    to: string;
    san: string;
    explanation?: string;
    suggestedBy: string;
    timestamp: number;
    accepted?: boolean;
    rejected?: boolean;
}
export interface ChatMessage {
    id: string;
    playerId: string;
    playerName: string;
    playerRole: PlayerRole;
    content: string;
    timestamp: number;
}
export interface GameState {
    fen: string;
    turn: PlayerColor;
    moves: Move[];
    status: GameStatus;
    winner?: PlayerColor;
    drawReason?: string;
}
export interface RoomState {
    room: Room;
    game: GameState;
    suggestion: SuggestedMove | null;
    chat: ChatMessage[];
    history: Move[];
}
export interface ClientToServerEvents {
    createRoom: (playerName: string) => void;
    joinRoom: (roomCode: string, playerName: string) => void;
    makeMove: (move: {
        from: string;
        to: string;
        promotion?: string;
    }) => void;
    requestTakeback: (steps?: number) => void;
    requestRedo: (steps?: number) => void;
    suggestMove: (suggestion: {
        from: string;
        to: string;
        san: string;
        explanation?: string;
    }) => void;
    clearSuggestion: () => void;
    acceptSuggestion: () => void;
    rejectSuggestion: () => void;
    sendChatMessage: (content: string) => void;
    restartGame: () => void;
    resign: () => void;
    offerDraw: () => void;
    flipBoard: () => void;
    reconnect: (roomCode: string, playerId: string) => void;
}
export interface ServerToClientEvents {
    roomCreated: (room: Room, player: Player) => void;
    roomJoined: (roomState: RoomState, player: Player) => void;
    roomError: (error: string) => void;
    gameStateUpdate: (game: GameState) => void;
    moveMade: (move: Move) => void;
    takebackPerformed: (game: GameState, steps: number) => void;
    redoPerformed: (game: GameState, steps: number) => void;
    suggestionUpdate: (suggestion: SuggestedMove | null) => void;
    suggestionAccepted: (move: Move) => void;
    suggestionRejected: () => void;
    chatMessage: (message: ChatMessage) => void;
    playerConnected: (player: Player) => void;
    playerDisconnected: (playerId: string) => void;
    gameStatusUpdate: (status: GameStatus, winner?: PlayerColor, drawReason?: string) => void;
    gameRestarted: (game: GameState) => void;
    playerRoleUpdate: (role: PlayerRole, color: PlayerColor) => void;
    boardFlipped: (flipped: boolean) => void;
    roomClosed: () => void;
}
export interface InterServerEvents {
    ping: () => void;
}
export interface SocketData {
    playerId: string;
    roomId: string;
    role: PlayerRole;
}
//# sourceMappingURL=types.d.ts.map