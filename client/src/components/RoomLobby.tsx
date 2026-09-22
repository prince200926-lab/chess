import { useState } from 'react';
import { Copy, Check, Loader2, Users, Crown, GraduationCap, User, Link2 } from 'lucide-react';

interface RoomLobbyProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  isConnected: boolean;
  createdRoomCode: string | null;
}

export function RoomLobby({ onCreateRoom, onJoinRoom, isConnected, createdRoomCode }: RoomLobbyProps) {
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setIsCreating(true);
    onCreateRoom(createName.trim());
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim()) return;
    setIsJoining(true);
    onJoinRoom(joinCode.trim().toUpperCase(), joinName.trim());
  };

  const copyInviteLink = () => {
    if (createdRoomCode) {
      const url = `${window.location.origin}/?room=${createdRoomCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teacher/10 text-teacher mb-4">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chess Tutor</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time chess for teaching and learning
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teacher" />
              Create Room (Teacher)
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teacher text-gray-900 dark:text-gray-100"
                  required
                  maxLength={20}
                  disabled={isCreating}
                />
              </div>
              <button
                type="submit"
                disabled={!createName.trim() || isCreating || !isConnected}
                className="w-full py-3 px-4 bg-teacher text-white rounded-lg font-medium hover:bg-teacher/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Create Room
                  </>
                )}
              </button>
            </form>
          </div>

          {createdRoomCode && (
            <div className="bg-teacher/5 dark:bg-teacher/10 border border-teacher/20 dark:border-teacher/30 rounded-2xl p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-teacher mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Room Created!
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Room Code</span>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono font-bold text-teacher tracking-widest">
                      {createdRoomCode}
                    </code>
                    <button
                      onClick={copyInviteLink}
                      className="p-2 bg-teacher/10 text-teacher rounded-lg hover:bg-teacher/20 transition-colors"
                      aria-label="Copy invite link"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Share Link</span>
                  <button
                    onClick={copyInviteLink}
                    className="px-3 py-1 text-sm bg-teacher text-white rounded-lg hover:bg-teacher/90 transition-colors flex items-center gap-1"
                  >
                    <Link2 className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                Waiting for student to join...
              </p>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                OR
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-student" />
              Join Room (Student)
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-student text-gray-900 dark:text-gray-100 text-center text-xl tracking-widest font-mono"
                  required
                  maxLength={6}
                  disabled={isJoining}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-student text-gray-900 dark:text-gray-100"
                  required
                  maxLength={20}
                  disabled={isJoining}
                />
              </div>
              <button
                type="submit"
                disabled={!joinCode.trim() || !joinName.trim() || isJoining || !isConnected}
                className="w-full py-3 px-4 bg-student text-white rounded-lg font-medium hover:bg-student/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Join Room
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Connected
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Connecting...
                </>
              )}
            </span>
            <span>Teacher creates • Student joins • Learn together</span>
          </div>
        </div>
      </div>
    </div>
  );
}