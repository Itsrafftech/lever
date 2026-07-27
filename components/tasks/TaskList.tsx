"use client";

import { useRef, useState } from "react";

import { TaskItem } from "@/components/tasks/TaskItem";
import type { TaskDTO } from "@/types/api";

export interface TaskListProps {
  tasks: TaskDTO[];
  timezone: string;
  /** Manual ordering only makes sense on the open-task views. */
  reorderable?: boolean;
  overdueBefore?: Date;
  onReorder?: (ids: string[]) => void;
  onToggleComplete: (task: TaskDTO) => void;
  onEdit: (task: TaskDTO) => void;
  onDiagnose: (task: TaskDTO) => void;
  onSetIntention: (task: TaskDTO) => void;
  onSkip: (task: TaskDTO) => void;
  onDelete: (task: TaskDTO) => void;
  onStartSession: (task: TaskDTO) => void;
}

export function TaskList({
  tasks,
  timezone,
  reorderable,
  overdueBefore,
  onReorder,
  ...handlers
}: TaskListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  function reset() {
    setDragIndex(null);
    setOverIndex(null);
    dragIndexRef.current = null;
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndexRef.current;
    reset();
    if (from === null || from === targetIndex || !onReorder) return;

    const next = [...tasks];
    const [moved] = next.splice(from, 1);
    next.splice(from < targetIndex ? targetIndex - 1 : targetIndex, 0, moved);
    onReorder(next.map((task) => task.id));
  }

  return (
    <ul className="divide-y-0">
      {tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          timezone={timezone}
          draggable={reorderable}
          isDragging={dragIndex === index}
          isDropTarget={overIndex === index && dragIndex !== index}
          isOverdue={
            overdueBefore && task.dueDate
              ? new Date(task.dueDate) < overdueBefore
              : false
          }
          onDragStart={(event) => {
            dragIndexRef.current = index;
            setDragIndex(index);
            event.dataTransfer.effectAllowed = "move";
            // Firefox refuses to start a drag without payload.
            event.dataTransfer.setData("text/plain", task.id);
          }}
          onDragOver={(event) => {
            if (dragIndexRef.current === null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOverIndex(index);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleDrop(index);
          }}
          onDragEnd={reset}
          {...handlers}
        />
      ))}
    </ul>
  );
}
