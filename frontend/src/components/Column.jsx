import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const COLUMN_STYLES = {
  todo:       { label: 'To Do',       dot: 'bg-gray-500' },
  inprogress: { label: 'In Progress', dot: 'bg-yellow-500' },
  done:       { label: 'Done',        dot: 'bg-green-500' },
};

export default function Column({ status, tasks, onEdit, onDelete, onAddTask, canEdit }) {
  const { label, dot } = COLUMN_STYLES[status];

  return (
    <div className="flex flex-col w-80 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="font-medium text-gray-300 text-sm">{label}</span>
          <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        {canEdit && (
          <button
            onClick={() => onAddTask(status)}
            className="text-gray-500 hover:text-indigo-400 text-xl leading-none transition-colors"
          >
            +
          </button>
        )}
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex flex-col gap-3 min-h-24 p-2 rounded-xl transition-colors flex-1
              ${snapshot.isDraggingOver ? 'bg-indigo-500/5 border border-dashed border-indigo-500/30' : 'border border-transparent'}
            `}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEdit}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}