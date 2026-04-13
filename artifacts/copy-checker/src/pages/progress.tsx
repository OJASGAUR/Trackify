import { useStore } from "@/hooks/use-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, TrendingUp, BookOpen, PenTool } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getCurrentDate } from "@/lib/schedule";

export default function ProgressDashboard() {
  const { tasks, settings } = useStore();

  let totalCopies = 0;
  let checkedCopies = 0;
  let homeworkTotal = 0;
  let homeworkChecked = 0;
  let classworkTotal = 0;
  let classworkChecked = 0;

  const classStats: Record<string, { hw: number, cw: number, total: number, checked: number, max: number, hwTotal: number, cwTotal: number }> = {};

  settings.classesConfig.forEach(c => {
    classStats[c.id] = { hw: 0, cw: 0, total: 0, checked: 0, max: 0, hwTotal: 0, cwTotal: 0 };
  });

  const currentMonthKey = format(getCurrentDate(settings), "yyyy-MM");

  tasks.forEach(t => {
    if (!t.assignedDate || format(parseISO(t.assignedDate), "yyyy-MM") !== currentMonthKey) return;

    const classConfig = settings.classesConfig.find(c => c.id === t.classId);
    if (!classConfig) return;

    const taskTotal = t.partTotal ?? classConfig.studentsCount;

    checkedCopies += t.checkedCount;
    totalCopies += taskTotal;

    if (classStats[t.classId]) {
      classStats[t.classId].checked += t.checkedCount;
      classStats[t.classId].max += taskTotal;
      if (t.copyType === "Homework") {
        homeworkChecked += t.checkedCount;
        homeworkTotal += taskTotal;
        classStats[t.classId].hw += t.checkedCount;
        classStats[t.classId].hwTotal += taskTotal;
      } else {
        classworkChecked += t.checkedCount;
        classworkTotal += taskTotal;
        classStats[t.classId].cw += t.checkedCount;
        classStats[t.classId].cwTotal += taskTotal;
      }
    }
  });

  const percentage = totalCopies > 0 ? Math.round((checkedCopies / totalCopies) * 100) : 0;
  const hwPercentage = homeworkTotal > 0 ? Math.round((homeworkChecked / homeworkTotal) * 100) : 0;
  const cwPercentage = classworkTotal > 0 ? Math.round((classworkChecked / classworkTotal) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-6 md:p-8 flex-1 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Progress</h1>
          <p className="text-muted-foreground">Track your copy checking milestones for the month.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 md:col-span-3 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-sm">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold font-display text-foreground">Overall Completion</h2>
                </div>
                <p className="text-muted-foreground mb-6 text-sm">
                  You've checked {checkedCopies} out of {totalCopies} copies this cycle.
                </p>
                <div className="flex items-center gap-4">
                  <Progress value={percentage} className="h-4 flex-1 bg-background/50 border shadow-inner" />
                  <span className="font-bold text-xl text-primary">{percentage}%</span>
                </div>
              </div>
              <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center flex-col shadow-inner bg-background relative overflow-hidden">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-1000 ease-in-out" 
                  style={{ height: `${percentage}%` }}
                />
                <span className="text-3xl font-bold font-display text-primary relative z-10">{checkedCopies}</span>
                <span className="text-xs text-muted-foreground font-medium relative z-10">Done</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                Homework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{homeworkChecked} <span className="text-sm text-muted-foreground font-normal">/ {homeworkTotal}</span></div>
              <Progress value={hwPercentage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground text-right">{hwPercentage}%</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PenTool className="h-5 w-5 text-accent-foreground" />
                Classwork
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{classworkChecked} <span className="text-sm text-muted-foreground font-normal">/ {classworkTotal}</span></div>
              <Progress value={cwPercentage} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground text-right">{cwPercentage}%</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border bg-sidebar hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalCopies - checkedCopies} <span className="text-sm text-muted-foreground font-normal">copies</span></div>
              <p className="text-sm text-muted-foreground mt-3">Keep up the great work!</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold font-display mb-6">Class Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {settings.classesConfig.map((c) => {
            const stats = classStats[c.id];
            const p = stats.max > 0 ? Math.round((stats.checked / stats.max) * 100) : 0;
            const hwP = stats.hwTotal > 0 ? Math.round((stats.hw / stats.hwTotal) * 100) : 0;
            const cwP = stats.cwTotal > 0 ? Math.round((stats.cw / stats.cwTotal) * 100) : 0;
            
            return (
              <Card key={c.id} className="overflow-hidden border-border/60 hover:border-primary/30 transition-colors hover-elevate">
                <div className="h-2 w-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${p}%` }} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{c.name}</CardTitle>
                    <span className="text-sm font-bold bg-muted px-2 py-1 rounded">{p}%</span>
                  </div>
                  <CardDescription>{c.studentsCount} students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Homework</span>
                      <span className="font-medium">{stats.hw}/{stats.hwTotal}</span>
                    </div>
                    <Progress value={hwP} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Classwork</span>
                      <span className="font-medium">{stats.cw}/{stats.cwTotal}</span>
                    </div>
                    <Progress value={cwP} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
