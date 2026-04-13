import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToastAction } from "@/components/ui/toast";
import { ClipboardCheck, BookOpen, PenTool, CheckCircle2 } from "lucide-react";
import { ClassName, CopyType, Task } from "@/lib/types";

function normalizePartIndex(task: Task): number {
  return task.partIndex ?? 1;
}

type LastMarkAction = {
  taskIds: string[];
  previousStates: Record<string, { status: Task["status"]; checkedCount: number }>;
  label: string;
};

export default function MarkCheck() {
  const { tasks, settings, bulkUpdateTasks } = useStore();
  const { toast } = useToast();
  const [lastMarkAction, setLastMarkAction] = useState<LastMarkAction | null>(null);
  const classOptions = settings.classesConfig;
  const [selectedClass, setSelectedClass] = useState<ClassName>(classOptions[0]?.id ?? "6A");
  const [selectedCopyType, setSelectedCopyType] = useState<CopyType>("Homework");
  const [selectedPart, setSelectedPart] = useState("all");

  const allMatchingTasks = useMemo(
    () => tasks.filter((task) => task.classId === selectedClass && task.copyType === selectedCopyType),
    [tasks, selectedClass, selectedCopyType]
  );

  const partIndexes = useMemo(() => {
    const unique = Array.from(new Set(allMatchingTasks.map(normalizePartIndex)));
    return unique.sort((a, b) => a - b);
  }, [allMatchingTasks]);

  useEffect(() => {
    if (selectedPart !== "all" && !partIndexes.includes(Number(selectedPart))) {
      setSelectedPart("all");
    }
  }, [partIndexes, selectedPart]);

  const selectedTasks = useMemo(
    () =>
      allMatchingTasks.filter((task) =>
        selectedPart === "all" ? true : `${normalizePartIndex(task)}` === selectedPart
      ),
    [allMatchingTasks, selectedPart]
  );

  const classInfo = settings.classesConfig.find((c) => c.id === selectedClass);
  const totalCopies = selectedTasks.reduce(
    (sum, task) => sum + (task.partTotal ?? classInfo?.studentsCount ?? 0),
    0
  );

  const handleMarkChecked = () => {
    if (!selectedTasks.length) return;

    const previousStates: Record<string, { status: Task["status"]; checkedCount: number }> = {};
    selectedTasks.forEach((task) => {
      previousStates[task.id] = {
        status: task.status,
        checkedCount: task.checkedCount,
      };
    });

    const label = `${selectedClass} ${selectedCopyType} ${selectedPart === "all" ? "All parts" : `Part ${selectedPart}`}`;

    setLastMarkAction({
      taskIds: selectedTasks.map((task) => task.id),
      previousStates,
      label,
    });

    bulkUpdateTasks(
      (task) =>
        task.classId === selectedClass &&
        task.copyType === selectedCopyType &&
        (selectedPart === "all" ? true : `${normalizePartIndex(task)}` === selectedPart),
      (task) => ({
        status: "checked",
        checkedCount: task.partTotal ?? classInfo?.studentsCount ?? 0,
      })
    );

    toast({
      title: "Marked copies checked",
      description: `${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"} updated for ${label}.`,
      action: (
        <ToastAction altText="Undo copy mark" onClick={() => handleUndo()}>
          Undo
        </ToastAction>
      ),
    });
  };

  const handleUndo = () => {
    if (!lastMarkAction) return;

    bulkUpdateTasks(
      (task) => lastMarkAction.taskIds.includes(task.id),
      (task) => ({
        status: lastMarkAction.previousStates[task.id]?.status ?? task.status,
        checkedCount: lastMarkAction.previousStates[task.id]?.checkedCount ?? task.checkedCount,
      })
    );

    setLastMarkAction(null);
    toast({
      title: "Undo complete",
      description: `Reverted check status for ${lastMarkAction.taskIds.length} task${lastMarkAction.taskIds.length === 1 ? "" : "s"}.`,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-6 md:p-8 flex-1 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mark as Checked</h1>
          <p className="text-muted-foreground">
            Select a class, copy type, and part to mark finished copies. The calendar and progress pages update automatically.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <Card className="shadow-sm border-border hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Mark Copies Checked
              </CardTitle>
              <CardDescription>Select the group you just finished checking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Class</label>
                  <Select value={selectedClass} onValueChange={(value) => setSelectedClass(value as ClassName)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((classConfig) => (
                        <SelectItem key={classConfig.id} value={classConfig.id}>
                          {classConfig.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Copy Type</label>
                  <Select value={selectedCopyType} onValueChange={(value) => setSelectedCopyType(value as CopyType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose copy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Homework">Homework</SelectItem>
                      <SelectItem value="Classwork">Classwork</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Part</label>
                <Select value={selectedPart} onValueChange={setSelectedPart}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose part" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All parts</SelectItem>
                    {partIndexes.map((partIndex) => (
                      <SelectItem key={partIndex} value={`${partIndex}`}>
                        Part {partIndex}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border p-4 bg-muted/40">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">Selection summary</span>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div>Matching tasks: <span className="text-foreground font-semibold">{selectedTasks.length}</span></div>
                  <div>Copies marked if checked: <span className="text-foreground font-semibold">{totalCopies}</span></div>
                  <div>Current status in calendar: <span className="text-foreground font-semibold">{selectedTasks.length ? "Pending or partial tasks" : "No matching tasks"}</span></div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={handleMarkChecked}
                  disabled={selectedTasks.length === 0}
                  className="w-full sm:w-auto"
                >
                  Mark Checked
                </Button>
                <p className="text-sm text-muted-foreground">
                  Once marked, matching tasks will show as complete on the calendar and progress dashboard.
                </p>
              </div>

              {lastMarkAction ? (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">Last action:</p>
                      <p className="text-muted-foreground">{lastMarkAction.taskIds.length} copied task{lastMarkAction.taskIds.length === 1 ? "" : "s"} marked as checked for {lastMarkAction.label}.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleUndo}>
                      Undo
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-sidebar hover-elevate">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                Copy Check Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use this page when you have finished checking a class copy batch. Select the correct part or choose All parts to update the calendar at once.
              </p>
              <div className="rounded-2xl border border-border p-4 bg-background/70">
                <div className="flex items-center gap-2 mb-2">
                  <PenTool className="h-4 w-4 text-accent-foreground" />
                  <span className="text-sm font-semibold">Why this helps</span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Keep the calendar synced with what you’ve checked.</li>
                  <li>Mark only the selected part or the complete copy set.</li>
                  <li>Progress updates immediately across the app.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
