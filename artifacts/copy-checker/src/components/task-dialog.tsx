import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/hooks/use-store";
import { ClassName, CopyType, Task } from "@/lib/types";
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_CLASSES: ClassName[] = ["6A", "6B", "7D", "8B", "9D", "10C"];
const COPY_TYPES: CopyType[] = ["Homework", "Classwork"];

function getTaskTotal(task: Task, studentsCount: number): number {
  return task.partTotal ?? studentsCount;
}

function getPartLabel(task: Task): string | null {
  if (task.partIndex === undefined || task.totalParts === undefined) return null;
  if (task.totalParts <= 1) return null;
  const start = task.partStart ?? 1;
  const end = start + (task.partTotal ?? 0) - 1;
  return `Part ${task.partIndex} — students ${start}–${end}`;
}

export function TaskDialog({
  dateStr,
  open,
  onOpenChange,
}: {
  dateStr: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { tasks, updateTask, addTask, removeTask, rescheduleTask, settings } = useStore();
  const dayTasks = tasks.filter((t) => t.assignedDate === dateStr);
  const date = parseISO(dateStr);

  const [editingPartial, setEditingPartial] = useState<string | null>(null);
  const [partialValue, setPartialValue] = useState("");
  const [movingTask, setMovingTask] = useState<string | null>(null);
  const [moveDate, setMoveDate] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newClass, setNewClass] = useState<ClassName>("6A");
  const [newCopyType, setNewCopyType] = useState<CopyType>("Homework");
  const [newCount, setNewCount] = useState<string>("");

  const getStudentsCount = (classId: ClassName) =>
    settings.classesConfig.find((c) => c.id === classId)?.studentsCount ?? 40;

  const handleMark = (task: Task, status: "checked" | "skipped") => {
    const total = getTaskTotal(task, getStudentsCount(task.classId));
    updateTask(task.id, { status, checkedCount: status === "checked" ? total : 0 });
  };

  const handleSavePartial = (taskId: string, maxTotal: number) => {
    const val = parseInt(partialValue, 10);
    if (!isNaN(val) && val > 0) {
      updateTask(taskId, { status: "partial", checkedCount: Math.min(val, maxTotal) });
    }
    setEditingPartial(null);
  };

  const handleMove = (taskId: string) => {
    if (!moveDate) return;
    rescheduleTask(taskId, moveDate);
    setMovingTask(null);
    setMoveDate("");
    onOpenChange(false);
  };

  const handleAddTask = () => {
    const count = parseInt(newCount, 10);
    const total = isNaN(count) || count <= 0 ? getStudentsCount(newClass) : count;
    const id = `manual-${newClass}-${newCopyType}-${dateStr}-${Date.now()}`;
    const task: Task = {
      id,
      classId: newClass,
      copyType: newCopyType,
      assignedDate: dateStr,
      status: "pending",
      checkedCount: 0,
      isManual: true,
      partTotal: total,
    };
    addTask(task);
    setNewClass("6A");
    setNewCopyType("Homework");
    setNewCount("");
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-display flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {format(date, "EEEE, MMMM do")}
          </DialogTitle>
          <DialogDescription>
            Mark, move, or add copy-checking tasks for this day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          {dayTasks.length === 0 && !showAddForm ? (
            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              No tasks for this day.
            </div>
          ) : (
            dayTasks.map((task) => {
              const total = getTaskTotal(task, getStudentsCount(task.classId));
              const partLabel = getPartLabel(task);
              const typeColor = task.copyType === "Homework"
                ? "text-emerald-700 bg-emerald-50"
                : "text-blue-700 bg-blue-50";

              return (
                <div
                  key={task.id}
                  className={cn(
                    "p-3 md:p-4 rounded-xl border transition-colors",
                    task.status === "checked" ? "bg-primary/5 border-primary/20" :
                    task.status === "partial" ? "bg-yellow-500/5 border-yellow-500/20" :
                    task.status === "skipped" ? "bg-muted/50 border-muted" :
                    "bg-card border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-base text-foreground">
                          Class {task.classId}
                        </h4>
                        <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", typeColor)}>
                          {task.copyType}
                        </span>
                        {task.isManual && (
                          <span className="text-[10px] font-normal bg-accent px-1.5 py-0.5 rounded text-accent-foreground">
                            manual
                          </span>
                        )}
                        {task.status === "checked" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      {partLabel && (
                        <p className="text-xs text-muted-foreground mt-0.5">{partLabel}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.status === "partial"
                          ? `${task.checkedCount} / ${total} checked`
                          : `${total} copies`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/20 text-secondary-foreground">
                        {task.status}
                      </span>
                      {task.isManual && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTask(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Move to another date */}
                  {movingTask === task.id ? (
                    <div className="flex items-center gap-2 mt-3 bg-background p-2 rounded-lg border shadow-sm">
                      <Input
                        type="date"
                        className="flex-1 text-sm h-8"
                        value={moveDate}
                        min={format(new Date(), "yyyy-MM-dd")}
                        onChange={(e) => setMoveDate(e.target.value)}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleMove(task.id)} disabled={!moveDate}>
                        Move
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setMovingTask(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : editingPartial === task.id ? (
                    <div className="flex items-center gap-2 mt-3 bg-background p-2 rounded-lg border shadow-sm">
                      <Input
                        type="number"
                        min="1"
                        max={total}
                        className="w-20 h-8 text-sm"
                        placeholder="Count"
                        value={partialValue}
                        onChange={(e) => setPartialValue(e.target.value)}
                        autoFocus
                      />
                      <span className="text-sm text-muted-foreground">/ {total}</span>
                      <div className="flex-1" />
                      <Button size="sm" onClick={() => handleSavePartial(task.id, total)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingPartial(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Button
                        size="sm"
                        variant={task.status === "checked" ? "default" : "outline"}
                        className={cn(
                          "h-8 text-xs",
                          task.status === "checked" && "bg-primary text-white"
                        )}
                        onClick={() => handleMark(task, "checked")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        All Done
                      </Button>

                      <Button
                        size="sm"
                        variant={task.status === "partial" ? "secondary" : "outline"}
                        className="h-8 text-xs"
                        onClick={() => {
                          setEditingPartial(task.id);
                          setPartialValue(task.checkedCount ? task.checkedCount.toString() : "");
                        }}
                      >
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Partial
                      </Button>

                      <Button
                        size="sm"
                        variant={task.status === "skipped" ? "secondary" : "ghost"}
                        className="h-8 text-xs text-muted-foreground"
                        onClick={() => handleMark(task, "skipped")}
                      >
                        <CircleDashed className="h-3.5 w-3.5 mr-1" />
                        Skip
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-muted-foreground ml-auto"
                        onClick={() => {
                          setMovingTask(task.id);
                          setMoveDate("");
                        }}
                      >
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        Move
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <Separator />

          {showAddForm ? (
            <div className="p-3 md:p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
              <h4 className="font-semibold text-sm text-foreground">Add Checking Task</h4>
              <p className="text-xs text-muted-foreground">
                Adding a task for a class will remove its auto-scheduled tasks and put this one here instead.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Class</Label>
                  <Select value={newClass} onValueChange={(v) => setNewClass(v as ClassName)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={newCopyType} onValueChange={(v) => setNewCopyType(v as CopyType)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COPY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  Copies{" "}
                  <span className="text-muted-foreground font-normal">
                    (default: {getStudentsCount(newClass)})
                  </span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder={`${getStudentsCount(newClass)}`}
                  value={newCount}
                  onChange={(e) => setNewCount(e.target.value)}
                  className="h-8 text-sm bg-background"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddTask}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed h-9 text-sm"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add Task for This Day
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
