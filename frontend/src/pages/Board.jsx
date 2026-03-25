import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { getWorkspace, getTasks, createTask, deleteTask } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Column from '../components/Column';
import TaskModal from '../components/TaskModal';

const STATUSES = ['todo', 'inprogress', 'done'];

export default function Board() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(null); // holds status string
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  // ── Load workspace + tasks ──────────────────────────────────────
  useEffect(() => {
    Promise.all([getWorkspace(workspaceId), getTasks(workspaceId)])
      .then(([wsRes, tasksRes]) => {
        setWorkspace(wsRes.data);
        setTasks(tasksRes.data);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // ── Join socket room + listen for events ────────────────────────
  useEffect(() => {
    if (!socket || !workspaceId) return;

    // Join this workspace's room
    socket.emit('workspace:join', { workspaceId });

    // Someone created a task
    socket.on('task:created', (task) => {
      setTasks(prev => [...prev, task]);
    });

    // Someone moved or edited a task
    socket.on('task:updated', (updatedTask) => {
      setTasks(prev =>
        prev.map(t => t._id === updatedTask._id ? updatedTask : t)
      );
    });

    // Someone deleted a task
    socket.on('task:deleted', (taskId) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    });

    // Someone added a comment
    socket.on('comment:added', ({ taskId, comment }) => {
      setTasks(prev => prev.map(t =>
        t._id === taskId
          ? { ...t, comments: [...(t.comments || []), comment] }
          : t
      ));
    });

    // Presence — who's online
    socket.on('presence:update', (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('comment:added');
      socket.off('presence:update');
    };
  }, [socket, workspaceId]);

  // ── Get user's role ─────────────────────────────────────────────
  const myRole = workspace?.members?.find(
    m => m.user._id === user?.id
  )?.role;
  const canEdit = myRole === 'admin' || myRole === 'editor';

  // ── Filter tasks by column ──────────────────────────────────────
  const tasksByStatus = (status) =>
    tasks
      .filter(t => t.status === status)
      .sort((a, b) => a.order - b.order);

  // ── Drag and drop ───────────────────────────────────────────────
  const onDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside or same spot
    if (!destination) return;
    if (destination.droppableId === source.droppableId &&
        destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const newOrder = destination.index;

    // Optimistic update — move card instantly on dragger's screen
    setTasks(prev => prev.map(t =>
      t._id === draggableId
        ? { ...t, status: newStatus, order: newOrder }
        : t
    ));

    // Tell server + broadcast to room
    socket?.emit('task:move', {
      taskId: draggableId,
      newStatus,
      newOrder,
      workspaceId
    });
  }, [socket, workspaceId]);

  // ── Create task ─────────────────────────────────────────────────
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await createTask(workspaceId, {
        title: newTaskTitle,
        status: showAddTask
      });
      setTasks(prev => [...prev, res.data]);
      // Tell others
      socket?.emit('task:create', { workspaceId, task: res.data });
      setNewTaskTitle('');
      setShowAddTask(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  // ── Delete task ─────────────────────────────────────────────────
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      socket?.emit('task:delete', { workspaceId, taskId });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  // ── Task updated from modal ─────────────────────────────────────
  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev =>
      prev.map(t => t._id === updatedTask._id ? updatedTask : t)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        Loading board...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar workspace={workspace} />

      {/* Online users */}
      <div className="px-6 py-2 border-b border-gray-800 flex items-center gap-2">
        <span className="text-xs text-gray-500">Online:</span>
        {onlineUsers.map((u, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-medium"
            title={u.username}
          >
            {u.username?.[0]?.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Board columns */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 p-6 min-w-max">
            {STATUSES.map(status => (
              <div key={status}>
                <Column
                  status={status}
                  tasks={tasksByStatus(status)}
                  onEdit={setSelectedTask}
                  onDelete={handleDeleteTask}
                  onAddTask={(s) => setShowAddTask(s)}
                  canEdit={canEdit}
                />

                {/* Inline add task form per column */}
                {showAddTask === status && (
                  <form onSubmit={handleAddTask} className="mt-3 px-2">
                    <input
                      autoFocus
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      className="w-full bg-gray-800 border border-indigo-500 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Add task
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddTask(null)}
                        className="text-gray-400 hover:text-white px-3 py-1.5 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          workspaceId={workspaceId}
          members={workspace?.members || []}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}