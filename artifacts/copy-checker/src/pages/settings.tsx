import { useState } from "react";
import { useStore } from "@/hooks/use-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings2,
  RefreshCcw,
  Save,
  Users,
  CalendarDays,
  Info,
} from "lucide-react";
import { AppSettings } from "@/lib/types";

const DAYS_OF_WEEK = [
  { label: "Sunday", short: "Sun", value: 0 },
  { label: "Monday", short: "Mon", value: 1 },
  { label: "Tuesday", short: "Tue", value: 2 },
  { label: "Wednesday", short: "Wed", value: 3 },
  { label: "Thursday", short: "Thu", value: 4 },
  { label: "Friday", short: "Fri", value: 5 },
  { label: "Saturday", short: "Sat", value: 6 },
];

export default function Settings() {
  const { settings, updateSettings, resetData } = useStore();
  const { toast } = useToast();

  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  const toggleWorkingDay = (dayValue: number) => {
    setLocalSettings((prev) => {
      const current = prev.workingDays;
      const next = current.includes(dayValue)
        ? current.filter((d) => d !== dayValue)
        : [...current, dayValue].sort((a, b) => a - b);
      return { ...prev, workingDays: next };
    });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: "Settings Saved",
      description: "Your schedule has been updated.",
    });
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure? This will delete all tasks and reset to default settings."
      )
    ) {
      resetData();
      toast({
        title: "Data Reset",
        description: "All data has been cleared.",
        variant: "destructive",
      });
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleClassChange = (id: string, count: number) => {
    if (isNaN(count) || count < 1) return;
    setLocalSettings((prev) => ({
      ...prev,
      classesConfig: prev.classesConfig.map((c) =>
        c.id === id ? { ...c, studentsCount: count } : c
      ),
    }));
  };

  const isSaturdayEnabled = localSettings.workingDays.includes(6);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="p-6 md:p-8 flex-1 max-w-4xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your classes and scheduling preferences.
          </p>
        </header>

        <div className="space-y-6">
          {/* Class Configuration */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Class Configuration
              </CardTitle>
              <CardDescription>
                Set the number of students per class. This determines the total
                copies to check per class.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {localSettings.classesConfig.map((c) => (
                  <div
                    key={c.id}
                    className="space-y-2 bg-muted/30 p-4 rounded-lg border border-transparent hover:border-border transition-colors"
                  >
                    <Label
                      htmlFor={`class-${c.id}`}
                      className="font-semibold text-base"
                    >
                      {c.name}
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`class-${c.id}`}
                        type="number"
                        min="1"
                        value={c.studentsCount}
                        onChange={(e) =>
                          handleClassChange(c.id, parseInt(e.target.value))
                        }
                        className="w-24 bg-background"
                        data-testid={`input-class-count-${c.id}`}
                      />
                      <span className="text-sm text-muted-foreground">
                        students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Rules */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Scheduling Rules
              </CardTitle>
              <CardDescription>
                Choose which days the auto-schedule assigns copy-checking tasks.
                You can always add tasks manually on any day from the calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Start date */}
              <div className="space-y-3 max-w-md">
                <Label
                  htmlFor="start-date"
                  className="text-base font-semibold"
                >
                  Schedule Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={localSettings.startDate}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="bg-background max-w-xs"
                  data-testid="input-start-date"
                />
                <p className="text-xs text-muted-foreground">
                  Tasks will be distributed starting from this date.
                </p>
              </div>

              <Separator />

              {/* Day toggles */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Working Days</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle which days of the week are included in the
                  auto-schedule.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const active = localSettings.workingDays.includes(
                      day.value
                    );
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWorkingDay(day.value)}
                        data-testid={`toggle-day-${day.short.toLowerCase()}`}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all select-none
                          ${
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                          }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Info className="h-3.5 w-3.5" />
                  Default is Mon–Sat, skipping 2nd Saturday and all Sundays.
                </p>
              </div>

              <Separator />

              {/* Skip 2nd Saturday toggle — only visible when Saturday is enabled */}
              <div
                className={`transition-opacity duration-200 ${
                  isSaturdayEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between max-w-md bg-muted/30 p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold cursor-pointer">
                      Skip 2nd Saturday
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Exclude the 2nd Saturday of each month from the
                      auto-schedule
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.skipSecondSaturday}
                    onCheckedChange={(v) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        skipSecondSaturday: v,
                      }))
                    }
                    disabled={!isSaturdayEnabled}
                    data-testid="toggle-skip-second-saturday"
                  />
                </div>
                {!isSaturdayEnabled && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Enable Saturday above to configure this option.
                  </p>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Even on days not included here, you can still open any date
                  on the calendar and manually add a task for that day.
                </span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-end">
              <Button
                onClick={handleSave}
                className="gap-2"
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4" /> Save Preferences
              </Button>
            </CardFooter>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20 bg-destructive/5 shadow-sm mt-12">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete all progress and start fresh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleReset}
                className="gap-2 hover-elevate"
                data-testid="button-reset-all"
              >
                <RefreshCcw className="h-4 w-4" /> Reset All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
