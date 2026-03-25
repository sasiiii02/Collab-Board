import { useState, useEffect } from 'react';
import { updateTask, addComment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function TaskModal({ task, workspaceId, members, onClose, onUpdated, canEdit }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    assignedTo: task.assignedTo?._id || '',
    dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [comments, setComments] = useState(task.comments || []);
  const [commentText, setCommentText] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateTask(task._id, form);
      onUpdated(res.data);
      // Tell other users about the update
      socket?.emit('task:update', { workspaceId, task: res.data });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await addComment(task._id, { text: commentText });
      const newComment = res.data;
      setComments([...comments, newComment]);
      setCommentText('');
      // Broadcast comment to others
      socket?.emit('comment:add', { workspaceId, taskId: task._id, comment: newComment });
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          {/* Title */}
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            disabled={!canEdit}
            className="w-full bg-transparent text-white text-xl font-semibold focus:outline-none border-b border-transparent focus:border-gray-700 pb-1 disabled:cursor-default"
          />

          {/* Description */}
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            disabled={!canEdit}
            placeholder="Add a description..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm resize-none disabled:cursor-default"
          />

          {/* Priority + Assign + Due */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:cursor-default"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Assigned to</label>
              <select
                value={form.assignedTo}
                onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:cursor-default"
              >
                <option value="">None</option>
                {members.map(m => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                disabled={!canEdit}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 disabled:cursor-default"
              />
            </div>
          </div>

          {/* Comments */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Comments ({comments.length})
            </h4>
            <div className="space-y-3 max-h-40 overflow-y-auto mb-3">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-medium shrink-0">
                    {c.user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-medium">{c.user?.username}</span>
                    <p className="text-sm text-gray-300 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}