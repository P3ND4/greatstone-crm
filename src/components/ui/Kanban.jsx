import { useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import cx from '../../lib/cx.js';

function Column({ column, children, count }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section className={cx('kanban__col', isOver && 'is-over', column.tone && `kanban__col--${column.tone}`)} aria-label={`${column.title} (${count})`}>
      <header className="kanban__head">
        <div className="row-between">
          <h2 className="kanban__title">{column.title}<span className="kanban__count">{count}</span></h2>
        </div>
        {column.meta && <p className="kanban__meta">{column.meta}</p>}
      </header>
      <div ref={setNodeRef} className="kanban__list">
        {children}
        {count === 0 && <p className="kanban__empty">{column.emptyLabel}</p>}
      </div>
    </section>
  );
}

function Draggable({ id, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div ref={setNodeRef} className={cx('kanban__item', isDragging && 'is-dragging')} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

/**
 * Generic Kanban board (drag & drop with mouse, touch and keyboard: Space to lift, arrows to move, Space to drop).
 * columns: [{ id, title, meta?, tone?, emptyLabel }] · items: [{ id, [groupBy]: columnId }]
 * renderCard(item, { overlay }) · onMove(itemId, toColumnId)
 */
export default function Kanban({ columns, items, groupBy = 'stage', renderCard, onMove, label }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const active = items.find((i) => i.id === activeId);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active: a }) => setActiveId(a.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active: a, over }) => {
        setActiveId(null);
        if (!over) return;
        const item = items.find((i) => i.id === a.id);
        if (item && item[groupBy] !== over.id) onMove(a.id, over.id);
      }}
      accessibility={{ screenReaderInstructions: { draggable: 'Press Space to pick up the card, use arrow keys to move between columns, Space to drop, Escape to cancel.' } }}
    >
      <div className="kanban" role="group" aria-label={label}>
        {columns.map((col) => {
          const colItems = items.filter((i) => i[groupBy] === col.id);
          return (
            <Column key={col.id} column={col} count={colItems.length}>
              {colItems.map((item) => <Draggable key={item.id} id={item.id}>{renderCard(item, { overlay: false })}</Draggable>)}
            </Column>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 160, easing: 'ease-out' }}>
        {active ? <div className="kanban__item is-overlay">{renderCard(active, { overlay: true })}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
