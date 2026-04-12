import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/use-store";
import { CheckCircle2, CircleDashed, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskDialog({ dateStr, open, onOpenChange }: { dateStr: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tasks, updateTask, settings } = useStore();
  const dayTasks = tasks.filter((t) => t.assignedDate === dateStr);
  const date = parseISO(dateStr);

  const [editingPartial, setEditingPartial] = useState<string | null>(null);
  const [partialValue, setPartialValue] = useState("");

  const handleMark = (taskId: string, status: "checked" | "skipped") => {
    const task = dayTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const classConfig = settings.classesConfig.find(c => c.id === task.classId);
    const total = classConfig?.studentsCount || 40;

    updateTask(taskId, {
      status,
      checkedCount: status === "checked" ? total : 0,
    });
  };

  const handleSavePartial = (taskId: string) => {
    const val = parseInt(partialValue, 10);
    if (!isNaN(val) && val > 0) {
      updateTask(taskId, {
        status: "partial",
        checkedCount: val,
      });
    }
    setEditingPartial(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {format(date, "EEEE, MMMM do")}
          </DialogTitle>
          <DialogDescription>
            Manage checking tasks for this day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {dayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              No tasks assigned for this day.
            </div>
          ) : (
            dayTasks.map((task) => {
              const classConfig = settings.classesConfig.find(c => c.id === task.classId);
              const total = classConfig?.studentsCount || 40;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    task.status === "checked" ? "bg-primary/5 border-primary/20" :
                    task.status === "partial" ? "bg-yellow-500/5 border-yellow-500/20" :
                    task.status === "skipped" ? "bg-muted/50 border-muted" :
                    "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        {task.classId} {task.copyType}
                        {task.status === "checked" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {task.status === "partial" ? `${task.checkedCount} / ${total} checked` : `${total} copies`}
                      </p>
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wider px-2 py-1 rounded bg-secondary/20 text-secondary-foreground">
                      {task.status}
                    </div>
                  </div>

                  {editingPartial === task.id ? (
                    <div className="flex items-center gap-2 mt-4 bg-background p-2 rounded-lg border shadow-sm">
                      <Input
                        type="number"
                        min="1"
                        max={total}
                        className="w-24"
                        placeholder="Count"
                        value={partialValue}
                        onChange={(e) => setPartialValue(e.target.value)}
                        autoFocus
                      />
                      <span className="text-sm text-muted-foreground">/ {total}</span>
                      <div className="flex-1" />
                      <Button size="sm" onClick={() => handleSavePartial(task.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingPartial(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        size="sm"
                        variant={task.status === "checked" ? "default" : "outline"}
                        className={cn(task.status === "checked" && "bg-primary hover:bg-primary/90 text-white")}
                        onClick={() => handleMark(task.id, "checked")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Checked All
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={task.status === "partial" ? "secondary" : "outline"}
                        onClick={() => {
                          setEditingPartial(task.id);
                          setPartialValue(task.checkedCount ? task.checkedCount.toString() : "");
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Partial
                      </Button>

                      <Button
                        size="sm"
                        variant={task.status === "skipped" ? "secondary" : "ghost"}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleMark(task.id, "skipped")}
                      >
                        <CircleDashed className="h-4 w-4 mr-2" />
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
