import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useLocalStorage } from "./use-local-storage";
import { AppSettings, Task, DEFAULT_SETTINGS } from "../lib/types";
import { generateSchedule, isWorkingDay } from "../lib/schedule";
import { format, parseISO } from "date-fns";

interface StoreContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  rescheduleTask: (taskId: string, newDate: string) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  resetData: () => void;
  getMissedPastTasks: () => Task[];
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "copy-checker-settings",
    DEFAULT_SETTINGS
  );

  const migratedSettings: AppSettings = {
    skipSecondSaturday: true,
    workingDays: [1, 2, 3, 4, 5, 6],
    defaultCopiesPerDay: 20,
    ...settings,
  };

  const [tasks, setTasks] = useLocalStorage<Task[]>("copy-checker-tasks", []);

  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Detect old v1 format (no partIndex) or tasks that landed on non-working days
    const hasOldFormat = tasks.some((t) => !t.isManual && t.partIndex === undefined);
    const hasTasksOnWrongDays = tasks.some(
      (t) =>
        !t.isManual &&
        t.status === "pending" &&
        !isWorkingDay(parseISO(t.assignedDate), migratedSettings)
    );

    if (hasOldFormat || hasTasksOnWrongDays) {
      // Keep manual tasks + already-marked auto tasks (preserve any progress)
      const keepTasks = tasks.filter((t) => t.isManual || t.status !== "pending");
      const fresh = generateSchedule(migratedSettings, keepTasks);
      setTasks(fresh);
    } else {
      const newTasks = generateSchedule(migratedSettings, tasks);
      if (newTasks.length > tasks.length) setTasks(newTasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // Drop pending non-manual tasks and regenerate
      const keepTasks = tasks.filter((t) => t.isManual || t.status !== "pending");
      const fresh = generateSchedule(updated, keepTasks);
      setTasks(fresh);
      return updated;
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  /**
   * Move a task to a new date.
   * If it's an auto task, also removes any other auto task with the same
   * classId+copyType from its original date so the calendar stays clean.
   */
  const rescheduleTask = (taskId: string, newDate: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignedDate: newDate } : t)));
  };

  /**
   * Add a manual task.
   * If a manual task is added for a classId+copyType combo that already has
   * auto-scheduled tasks, remove those auto tasks so the manual one takes over.
   */
  const addTask = (task: Task) => {
    setTasks((prev) => {
      if (prev.some((t) => t.id === task.id)) return prev;

      // Remove all auto tasks for the same classId+copyType (user is manually overriding)
      const filtered = prev.filter(
        (t) => !(t.classId === task.classId && t.copyType === task.copyType && !t.isManual)
      );

      return [...filtered, task];
    });
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const resetData = () => {
    setSettings(DEFAULT_SETTINGS);
    setTasks([]);
  };

  const getMissedPastTasks = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    return tasks.filter((t) => t.assignedDate < today && t.status === "pending");
  };

  const value = useMemo(
    () => ({
      settings: migratedSettings,
      updateSettings,
      tasks,
      updateTask,
      rescheduleTask,
      addTask,
      removeTask,
      resetData,
      getMissedPastTasks,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [migratedSettings, tasks]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
