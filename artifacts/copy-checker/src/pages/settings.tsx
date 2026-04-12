import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Settings2, RefreshCcw, Save, Users, CalendarDays } from "lucide-react";
import { AppSettings } from "@/lib/types";

export default function Settings() {
  const { settings, updateSettings, resetData } = useStore();
  const { toast } = useToast();
  
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [includeSunday, setIncludeSunday] = useState(settings.workingDays.includes(0));

  const handleSave = () => {
    updateSettings({
      ...localSettings,
      workingDays: includeSunday ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6],
    });
    toast({
      title: "Settings Saved",
      description: "Your schedule has been updated.",
    });
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will delete all tasks and reset to default settings.")) {
      resetData();
      toast({
        title: "Data Reset",
        description: "All data has been cleared.",
        variant: "destructive"
      });
      // reset local state too
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleClassChange = (id: string, count: number) => {
    if (isNaN(count) || count < 1) return;
    setLocalSettings(prev => ({
      ...prev,
      classesConfig: prev.classesConfig.map(c => 
        c.id === id ? { ...c, studentsCount: count } : c
      )
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-6 md:p-8 flex-1 max-w-4xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">Configure your classes and scheduling preferences.</p>
        </header>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Class Configuration
              </CardTitle>
              <CardDescription>
                Set the number of students per class. This determines the total copies per class.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {localSettings.classesConfig.map(c => (
                  <div key={c.id} className="space-y-2 bg-muted/30 p-4 rounded-lg border border-transparent hover:border-border transition-colors">
                    <Label htmlFor={`class-${c.id}`} className="font-semibold text-base">{c.name}</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`class-${c.id}`}
                        type="number"
                        min="1"
                        value={c.studentsCount}
                        onChange={(e) => handleClassChange(c.id, parseInt(e.target.value))}
                        className="w-24 bg-background"
                      />
                      <span className="text-sm text-muted-foreground">students</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Scheduling Rules
              </CardTitle>
              <CardDescription>
                Define how tasks are distributed across the calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 max-w-md">
                <Label htmlFor="start-date" className="text-base font-semibold">Schedule Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={localSettings.startDate}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">The algorithm will start distributing new tasks from this date.</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between max-w-md bg-muted/30 p-4 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Include Sundays</Label>
                  <p className="text-sm text-muted-foreground">Assign checking tasks on Sundays</p>
                </div>
                <Switch
                  checked={includeSunday}
                  onCheckedChange={setIncludeSunday}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-end">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Preferences
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5 shadow-sm mt-12">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete all progress and start fresh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleReset} className="gap-2 hover-elevate">
                <RefreshCcw className="h-4 w-4" /> Reset All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
