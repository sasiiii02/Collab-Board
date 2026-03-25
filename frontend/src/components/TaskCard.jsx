import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_STYLES = {
  high:   'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low:    'bg-green-500/10 text-green-400 border-green-500/20',
};

export default function TaskCard({ task, index, onEdit, onDelete, canEdit }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-gray-900 border rounded-xl p-4 cursor-pointer select-none
            transition-shadow
            ${snapshot.isDragging
              ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 rotate-1'
              : 'border-gray-800 hover:border-gray-700'}
          `}
          onClick={() => onEdit(task)}
        >
          {/* Priority badge */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>
            {canEdit && (
              <button
                onClick={e => { e.stopPropagation(); setShowConfirm(true); }}
                className="text-gray-600 hover:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            )}
          </div>

          {/* Title */}
          <p className="text-white text-sm font-medium leading-snug mb-3">
            {task.title}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{task.assignedTo?.username || 'Unassigned'}</span>
            <div className="flex items-center gap-2">
              {task.comments?.length > 0 && (
                <span>💬 {task.comments.length}</span>
              )}
              {task.dueDate && (
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Delete confirm */}
          {showConfirm && (
            <div
              className="mt-3 pt-3 border-t border-gray-800"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-xs text-gray-400 mb-2">Delete this task?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onDelete(task._id)}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}