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
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_CLASSES: ClassName[] = ["6A", "6B", "7D", "8B", "9D", "10C"];
const COPY_TYPES: CopyType[] = ["Homework", "Classwork"];

function getTaskTotal(task: Task, studentsCount: number): number {
  // v2: use partTotal; v1/manual: use studentsCount
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
  const { tasks, updateTask, addTask, removeTask, settings } = useStore();
  const dayTasks = tasks.filter((t) => t.assignedDate === dateStr);
  const date = parseISO(dateStr);

  const [editingPartial, setEditingPartial] = useState<string | null>(null);
  const [partialValue, setPartialValue] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newClass, setNewClass] = useState<ClassName>("6A");
  const [newCopyType, setNewCopyType] = useState<CopyType>("Homework");
  const [newCount, setNewCount] = useState<string>("");

  const getDefaultCount = (classId: ClassName) => {
    return settings.classesConfig.find((c) => c.id === classId)?.studentsCount ?? 40;
  };

  const handleMark = (task: Task, status: "checked" | "skipped") => {
    const studentsCount =
      settings.classesConfig.find((c) => c.id === task.classId)?.studentsCount ?? 40;
    const total = getTaskTotal(task, studentsCount);
    updateTask(task.id, {
      status,
      checkedCount: status === "checked" ? total : 0,
    });
  };

  const handleSavePartial = (taskId: string, maxTotal: number) => {
    const val = parseInt(partialValue, 10);
    if (!isNaN(val) && val > 0) {
      updateTask(taskId, {
        status: "partial",
        checkedCount: Math.min(val, maxTotal),
      });
    }
    setEditingPartial(null);
  };

  const handleAddTask = () => {
    const count = parseInt(newCount, 10);
    const total = isNaN(count) || count <= 0 ? getDefaultCount(newClass) : count;
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {format(date, "EEEE, MMMM do")}
          </DialogTitle>
          <DialogDescription>
            View, mark, or add copy-checking tasks for this day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {dayTasks.length === 0 && !showAddForm ? (
            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
              No tasks for this day yet.
            </div>
          ) : (
            dayTasks.map((task) => {
              const studentsCount =
                settings.classesConfig.find((c) => c.id === task.classId)?.studentsCount ?? 40;
              const total = getTaskTotal(task, studentsCount);
              const partLabel = getPartLabel(task);

              return (
                <div
                  key={task.id}
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    task.status === "checked"
                      ? "bg-primary/5 border-primary/20"
                      : task.status === "partial"
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : task.status === "skipped"
                      ? "bg-muted/50 border-muted"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        Class {task.classId} — {task.copyType}
                        {task.isManual && (
                          <span className="text-[10px] font-normal bg-accent px-1.5 py-0.5 rounded text-accent-foreground">
                            manual
                          </span>
                        )}
                        {task.status === "checked" && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </h4>
                      {partLabel && (
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {partLabel}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {task.status === "partial"
                          ? `${task.checkedCount} / ${total} checked`
                          : `${total} copies`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium uppercase tracking-wider px-2 py-1 rounded bg-secondary/20 text-secondary-foreground">
                        {task.status}
                      </div>
                      {task.isManual && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTask(task.id)}
                          data-testid={`remove-task-${task.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
                        data-testid="input-partial-count"
                      />
                      <span className="text-sm text-muted-foreground">/ {total}</span>
                      <div className="flex-1" />
                      <Button
                        size="sm"
                        onClick={() => handleSavePartial(task.id, total)}
                        data-testid="button-save-partial"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPartial(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        size="sm"
                        variant={task.status === "checked" ? "default" : "outline"}
                        className={cn(
                          task.status === "checked" &&
                            "bg-primary hover:bg-primary/90 text-white"
                        )}
                        onClick={() => handleMark(task, "checked")}
                        data-testid={`button-check-${task.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Checked All
                      </Button>

                      <Button
                        size="sm"
                        variant={task.status === "partial" ? "secondary" : "outline"}
                        onClick={() => {
                          setEditingPartial(task.id);
                          setPartialValue(
                            task.checkedCount ? task.checkedCount.toString() : ""
                          );
                        }}
                        data-testid={`button-partial-${task.id}`}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Partial
                      </Button>

                      <Button
                        size="sm"
                        variant={task.status === "skipped" ? "secondary" : "ghost"}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleMark(task, "skipped")}
                        data-testid={`button-skip-${task.id}`}
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

          <Separator />

          {showAddForm ? (
            <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-4">
              <h4 className="font-semibold text-foreground">Add Checking Task</h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Class</Label>
                  <Select
                    value={newClass}
                    onValueChange={(v) => setNewClass(v as ClassName)}
                  >
                    <SelectTrigger data-testid="select-new-class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>
                          Class {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Copy Type</Label>
                  <Select
                    value={newCopyType}
                    onValueChange={(v) => setNewCopyType(v as CopyType)}
                  >
                    <SelectTrigger data-testid="select-new-copytype">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COPY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">
                  Number of copies{" "}
                  <span className="text-muted-foreground font-normal">
                    (default: {getDefaultCount(newClass)})
                  </span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder={`${getDefaultCount(newClass)}`}
                  value={newCount}
                  onChange={(e) => setNewCount(e.target.value)}
                  className="bg-background"
                  data-testid="input-new-count"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  data-testid="button-confirm-add-task"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setShowAddForm(true)}
              data-testid="button-add-task"
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
