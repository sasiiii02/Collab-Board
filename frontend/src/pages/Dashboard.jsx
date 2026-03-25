import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkspaces, createWorkspace, joinWorkspace } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [joinToken, setJoinToken] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getWorkspaces()
      .then(res => setWorkspaces(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createWorkspace({ name: newName, description: newDesc });
      setWorkspaces([...workspaces, res.data]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await joinWorkspace(joinToken);
      setWorkspaces([...workspaces, res.data.workspace]);
      setShowJoin(false);
      setJoinToken('');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid invite link');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-400">CollabBoard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Hi, {user?.username}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Your Workspaces</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJoin(true)}
              className="border border-gray-700 hover:border-gray-500 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Join via invite
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + New Workspace
            </button>
          </div>
        </div>

        {/* Workspace grid */}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">No workspaces yet</p>
            <p className="text-sm">Create one or join via invite link</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map(ws => (
              <div
                key={ws._id}
                onClick={() => navigate(`/board/${ws._id}`)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl p-6 cursor-pointer transition-colors group"
              >
                <h3 className="font-semibold text-lg group-hover:text-indigo-400 transition-colors">
                  {ws.name}
                </h3>
                {ws.description && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{ws.description}</p>
                )}
                <p className="text-gray-600 text-xs mt-4">
                  {ws.members?.length} member{ws.members?.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Workspace name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Join Workspace</h3>
            <form onSubmit={handleJoin} className="space-y-4">
              <input
                value={joinToken}
                onChange={e => setJoinToken(e.target.value)}
                placeholder="Paste invite token here"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                required
              />
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowJoin(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}