import { useState, type PointerEvent, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskDialog } from "@/components/task-dialog";
import { Task } from "@/lib/types";
import { getCurrentDate } from "@/lib/schedule";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

/** Chip color based on task type + status */
function getChipClass(task: Task, isMissed: boolean) {
  if (task.status === "checked") return "bg-primary/25 text-primary border border-primary/30";
  if (task.status === "partial") return "bg-yellow-400/25 text-yellow-700 border border-yellow-400/30";
  if (task.status === "skipped") return "bg-muted/60 text-muted-foreground line-through border border-border";
  if (isMissed) return "bg-destructive/20 text-destructive border border-destructive/30";
  // pending + upcoming: differentiate HW vs CW
  if (task.copyType === "Homework") return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  return "bg-blue-100 text-blue-800 border border-blue-200";
}

function getDayStatus(tasks: Task[], dateStr: string, settings: any) {
  if (tasks.length === 0) return "none";
  if (tasks.every((t) => t.status === "checked" || t.status === "skipped")) return "completed";
  if (tasks.some((t) => t.status === "partial" || t.status === "checked")) return "partial";
  if (dateStr < format(getCurrentDate(settings), "yyyy-MM-dd") && tasks.some((t) => t.status === "pending"))
    return "missed";
  return "upcoming";
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "bg-primary",
    partial: "bg-yellow-500",
    missed: "bg-destructive",
    upcoming: "bg-secondary",
  };
  if (status === "none") return null;
  return <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", colors[status] ?? "bg-muted")} />;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DraggableTask({
  task,
  isMissed,
  onClick,
}: {
  task: Task;
  isMissed: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex flex-col md:flex-row items-center justify-center md:justify-start gap-px md:gap-1 px-0.5 py-0.5 md:px-2 md:py-1 rounded-[4px] md:rounded-md text-[8px] md:text-xs font-medium cursor-grab active:cursor-grabbing w-full overflow-hidden text-center md:text-left leading-[1.1] md:leading-none whitespace-nowrap",
        getChipClass(task, isMissed),
        isDragging && "opacity-50"
      )}
    >
      <span className="md:hidden block font-bold">{task.classId}</span>
      <span className="hidden md:inline">{task.classId} {task.copyType.slice(0, 2)}-{task.partIndex}</span>
    </div>
  );
}

function DroppableDay({
  dateStr,
  children,
  onClick,
}: {
  dateStr: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "min-h-[80px] md:min-h-[100px] h-full p-1 md:p-2 border border-border rounded-md bg-background hover:bg-muted/20 transition-colors cursor-pointer",
        isOver && "bg-primary/10 border-primary/30"
      )}
    >
      {children}
    </div>
  );
}

export default function Calendar() {
  const { tasks, updateTask, getMissedPastTasks, settings } = useStore();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(getCurrentDate(settings)));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const monthAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setDraggedTask(task || null);
    setIsDragging(true);
    setSwipeStart(null);
  };

  const handlePrevMonth = () => setCurrentMonth((prev) => startOfMonth(addMonths(prev, -1)));
  const handleNextMonth = () => setCurrentMonth((prev) => startOfMonth(addMonths(prev, 1)));

  const checkEdgesAndAdvanceMonth = (clientX: number) => {
    if (!calendarRef.current) return;
    
    const rect = calendarRef.current.getBoundingClientRect();
    const EDGE_THRESHOLD = 100;
    const distFromLeft = clientX - rect.left;
    const distFromRight = rect.right - clientX;

    // Clear existing timer
    if (monthAdvanceTimerRef.current) {
      clearTimeout(monthAdvanceTimerRef.current);
    }

    // Advance to next month if dragging near right edge
    if (distFromRight < EDGE_THRESHOLD && distFromRight > 0) {
      monthAdvanceTimerRef.current = setTimeout(() => {
        handleNextMonth();
      }, 400);
    }
    // Go to previous month if dragging near left edge
    else if (distFromLeft < EDGE_THRESHOLD && distFromLeft > 0) {
      monthAdvanceTimerRef.current = setTimeout(() => {
        handlePrevMonth();
      }, 400);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    checkEdgesAndAdvanceMonth(event.clientX);
  };

  const handleSwipeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (isDragging) return;
    setSwipeStart({ x: event.clientX, y: event.clientY });
  };

  const handleSwipeEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (isDragging || swipeStart === null) {
      setSwipeStart(null);
      return;
    }

    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    setSwipeStart(null);

    // If scrolling mostly vertically, ignore the horizontal swipe attempt
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (deltaX > 80) {
      handlePrevMonth();
    } else if (deltaX < -80) {
      handleNextMonth();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    setIsDragging(false);

    // Clear month advance timer
    if (monthAdvanceTimerRef.current) {
      clearTimeout(monthAdvanceTimerRef.current);
      monthAdvanceTimerRef.current = null;
    }

    if (!over || !active) return;

    const taskId = active.id as string;
    const newDate = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.assignedDate === newDate) return;

    updateTask(taskId, { assignedDate: newDate });
  };

  const missedTasks = getMissedPastTasks();
  const months = [currentMonth];
  const today = format(getCurrentDate(settings), "yyyy-MM-dd");

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-3 md:p-8 flex-1 max-w-5xl mx-auto w-full">
        <header className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Schedule</h1>
            <p className="text-sm md:text-base text-muted-foreground">Plan and track your copy checking workload.</p>
          </div>

          {missedTasks.length > 0 && (
            <Card className="p-3 bg-destructive/10 border-destructive/20 flex items-start gap-2 w-full md:w-auto md:max-w-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive/90">
                <strong>{missedTasks.length} pending task{missedTasks.length > 1 ? "s" : ""}</strong> from past days — tap the red dates to update.
              </p>
            </Card>
          )}
        </header>

        <Card
          ref={calendarRef}
          className="p-2 md:p-5 overflow-hidden shadow-xl border-primary/10 rounded-[2rem]"
          onPointerDown={handleSwipeStart}
          onPointerUp={handleSwipeEnd}
          onPointerMove={handlePointerMove}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3 md:mb-5 px-1">
            <div>
              <h2 className="text-base md:text-xl font-bold font-display">Monthly schedule</h2>
              <p className="text-sm text-muted-foreground">Swipe left/right or use arrows to change month. Only one month is visible at a time.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-3 py-2 rounded-2xl border border-border bg-muted/70 text-sm font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid gap-4">
              {months.map((monthDate) => {
                const monthStart = startOfMonth(monthDate);
                const monthEnd = endOfMonth(monthStart);
                const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                const leadingBlanks = monthStart.getDay();

                return (
                  <div key={format(monthDate, "yyyy-MM")} className="rounded-3xl border border-border bg-background p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{format(monthDate, "MMMM yyyy")}</h3>
                        <p className="text-xs text-muted-foreground">{days.length} days</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px mb-px text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {WEEKDAYS.map((d) => (
                        <div key={`${format(monthDate, "yyyy-MM")}-${d}`} className="text-center py-1">
                          <span className="md:hidden">{d[0]}</span>
                          <span className="hidden md:inline">{d}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                      {Array.from({ length: leadingBlanks }).map((_, i) => (
                        <div key={`empty-${format(monthDate, "yyyy-MM")}-${i}`} className="bg-muted/30 min-h-[70px] md:min-h-[90px] lg:min-h-[120px]" />
                      ))}

                      {days.map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const dayTasks = tasks.filter((t) => t.assignedDate === dateStr);
                        const status = getDayStatus(dayTasks, dateStr, settings);
                        const isCurrentDay = isToday(date);
                        const isMissed = status === "missed";
                        const visibleTasks = dayTasks.slice(0, 2);
                        const overflow = dayTasks.length - visibleTasks.length;

                        return (
                          <DroppableDay key={dateStr} dateStr={dateStr} onClick={() => setSelectedDate(dateStr)}>
                            <div
                              onClick={() => setSelectedDate(dateStr)}
                              className={cn(
                                "bg-card min-h-[60px] md:min-h-[80px] h-full w-full p-1 md:p-2 transition-colors hover:bg-accent/60 select-none",
                                isCurrentDay && "ring-2 ring-inset ring-primary z-10",
                                isMissed && "bg-destructive/5"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={cn(
                                    "text-[11px] md:text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                                    isCurrentDay
                                      ? "bg-primary text-primary-foreground"
                                      : isMissed
                                      ? "text-destructive"
                                      : "text-foreground"
                                  )}
                                >
                                  {format(date, "d")}
                                </span>
                                <StatusDot status={status} />
                              </div>

                              <div className="flex flex-col gap-1">
                                {visibleTasks.map((t) => (
                                  <DraggableTask
                                    key={t.id}
                                    task={t}
                                    isMissed={isMissed}
                                    onClick={() => setSelectedDate(dateStr)}
                                  />
                                ))}
                                {overflow > 0 && (
                                  <div className="text-[9px] text-muted-foreground font-medium pl-1">
                                    +{overflow} more
                                  </div>
                                )}
                              </div>
                            </div>
                          </DroppableDay>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {draggedTask ? (
                <div
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                    getChipClass(draggedTask, false)
                  )}
                >
                  {draggedTask.classId} {draggedTask.copyType.slice(0, 2)}-{draggedTask.partIndex}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-[10px] md:text-xs text-muted-foreground items-center justify-center">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-2.5 rounded bg-emerald-100 border border-emerald-200" />
              Homework
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-2.5 rounded bg-blue-100 border border-blue-200" />
              Classwork
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Completed
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Partial
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive" /> Missed
            </div>
          </div>
        </Card>
      </div>

      {selectedDate && (
        <TaskDialog
          dateStr={selectedDate}
          open={!!selectedDate}
          onOpenChange={(open) => !open && setSelectedDate(null)}
        />
      )}
    </div>
  );
}
