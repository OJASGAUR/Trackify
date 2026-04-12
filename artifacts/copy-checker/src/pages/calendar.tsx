import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, CircleDashed, AlertCircle, Clock } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TaskDialog } from "@/components/task-dialog";
import { Task } from "@/lib/types";

export default function Calendar() {
  const { tasks, getMissedPastTasks } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const missedTasks = getMissedPastTasks();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (dateStr: string) => {
    const dayTasks = tasks.filter((t) => t.assignedDate === dateStr);
    if (dayTasks.length === 0) return "none";
    if (dayTasks.every((t) => t.status === "checked" || t.status === "skipped")) return "completed";
    if (dayTasks.some((t) => t.status === "partial" || t.status === "checked")) return "partial";
    if (dateStr < format(new Date(), "yyyy-MM-dd") && dayTasks.some((t) => t.status === "pending")) return "missed";
    return "upcoming";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-primary text-primary-foreground";
      case "partial": return "bg-yellow-500 text-white";
      case "missed": return "bg-destructive text-destructive-foreground";
      case "upcoming": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-6 md:p-8 flex-1 max-w-6xl mx-auto w-full">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Schedule</h1>
            <p className="text-muted-foreground">Plan and track your copy checking workload.</p>
          </div>
          
          {missedTasks.length > 0 && (
            <Card className="p-4 bg-destructive/10 border-destructive/20 flex items-start gap-3 w-full md:w-auto md:max-w-md">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive text-sm">Missed Days Detected</h3>
                <p className="text-xs text-destructive/80 mt-1">
                  You have {missedTasks.length} pending tasks from past days. Click on red dates to update them.
                </p>
              </div>
            </Card>
          )}
        </header>

        <Card className="p-4 md:p-6 overflow-hidden shadow-lg border-primary/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display">{format(currentDate, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden shadow-sm">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="bg-muted/50 p-2 md:p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}

            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card min-h-[100px] md:min-h-[120px] p-2 opacity-50" />
            ))}

            {days.map((date, i) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayTasks = tasks.filter((t) => t.assignedDate === dateStr);
              const status = getDayStatus(dateStr);
              const isCurrentDay = isToday(date);
              
              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    "bg-card min-h-[100px] md:min-h-[120px] p-2 transition-all cursor-pointer hover:bg-accent group relative",
                    isCurrentDay && "ring-2 ring-inset ring-primary z-10",
                    status === "missed" && "bg-destructive/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={cn(
                        "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full",
                        isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground group-hover:text-primary"
                      )}
                    >
                      {format(date, "d")}
                    </span>
                    {status !== "none" && (
                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "text-[10px] md:text-xs px-1.5 py-1 rounded truncate flex items-center gap-1",
                          t.status === "checked" ? "bg-primary/20 text-primary-foreground font-medium" :
                          t.status === "partial" ? "bg-yellow-500/20 text-yellow-700 font-medium" :
                          t.status === "skipped" ? "bg-muted text-muted-foreground line-through" :
                          status === "missed" ? "bg-destructive/20 text-destructive font-medium" :
                          "bg-secondary/20 text-secondary-foreground"
                        )}
                      >
                        {t.status === "checked" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                        {t.status === "partial" && <Clock className="h-3 w-3 shrink-0" />}
                        {t.status === "skipped" && <CircleDashed className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{t.classId} {t.copyType.substring(0, 2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground items-center justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Completed</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Partial</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-secondary" /> Upcoming</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-destructive" /> Missed</div>
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
