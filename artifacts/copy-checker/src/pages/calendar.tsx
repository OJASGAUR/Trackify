import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskDialog } from "@/components/task-dialog";
import { Task } from "@/lib/types";

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

function getDayStatus(tasks: Task[], dateStr: string) {
  if (tasks.length === 0) return "none";
  if (tasks.every((t) => t.status === "checked" || t.status === "skipped")) return "completed";
  if (tasks.some((t) => t.status === "partial" || t.status === "checked")) return "partial";
  if (dateStr < format(new Date(), "yyyy-MM-dd") && tasks.some((t) => t.status === "pending"))
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

export default function Calendar() {
  const { tasks, getMissedPastTasks } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const missedTasks = getMissedPastTasks();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = monthStart.getDay();
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-3 md:p-8 flex-1 max-w-6xl mx-auto w-full">
        <header className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Schedule</h1>
            <p className="text-sm text-muted-foreground">Plan and track your copy checking workload.</p>
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

        <Card className="p-2 md:p-5 overflow-hidden shadow-md border-primary/10">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3 md:mb-5 px-1">
            <h2 className="text-base md:text-xl font-bold font-display">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-2"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px mb-px">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[9px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1"
              >
                {/* Show 1 letter on mobile, 3 on desktop */}
                <span className="md:hidden">{d[0]}</span>
                <span className="hidden md:inline">{d}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {/* Leading blanks */}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`b-${i}`} className="bg-muted/30 min-h-[70px] md:min-h-[110px]" />
            ))}

            {days.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayTasks = tasks.filter((t) => t.assignedDate === dateStr);
              const status = getDayStatus(dayTasks, dateStr);
              const isCurrentDay = isToday(date);
              const isMissed = status === "missed";

              // On mobile show max 2 chips + overflow count
              const visibleTasks = dayTasks.slice(0, 2);
              const overflow = dayTasks.length - visibleTasks.length;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    "bg-card min-h-[70px] md:min-h-[110px] p-1 md:p-2 cursor-pointer transition-colors hover:bg-accent/60 select-none",
                    isCurrentDay && "ring-2 ring-inset ring-primary z-10",
                    isMissed && "bg-destructive/5"
                  )}
                >
                  {/* Date number + status dot */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs md:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full",
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

                  {/* Task chips */}
                  <div className="flex flex-col gap-0.5">
                    {visibleTasks.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "rounded px-1 py-0.5 text-[9px] md:text-[11px] font-semibold leading-tight truncate flex items-center gap-0.5",
                          getChipClass(t, isMissed)
                        )}
                      >
                        <span className="truncate">
                          {t.classId}&nbsp;
                          <span className={cn("font-bold", t.copyType === "Homework" ? "text-emerald-700" : "text-blue-700")}>
                            {t.copyType === "Homework" ? "HW" : "CW"}
                          </span>
                          {t.totalParts && t.totalParts > 1 && (
                            <span className="opacity-60 text-[8px]"> {t.partIndex}</span>
                          )}
                        </span>
                      </div>
                    ))}
                    {overflow > 0 && (
                      <div className="text-[9px] text-muted-foreground font-medium pl-1">
                        +{overflow} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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
