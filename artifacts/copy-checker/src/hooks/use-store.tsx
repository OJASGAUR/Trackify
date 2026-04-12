import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { AppSettings, Task, DEFAULT_SETTINGS } from "../lib/types";
import { generateSchedule } from "../lib/schedule";
import { format } from "date-fns";

interface StoreContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
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

  // Migrate old settings that lack the skipSecondSaturday field
  const migratedSettings: AppSettings = {
    skipSecondSaturday: true,
    ...settings,
  };

  const [tasks, setTasks] = useLocalStorage<Task[]>("copy-checker-tasks", []);

  // On mount or settings change, regenerate schedule if some combos are missing
  useEffect(() => {
    const newTasks = generateSchedule(migratedSettings, tasks);
    if (newTasks.length > tasks.length) {
      setTasks(newTasks);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [migratedSettings.startDate, migratedSettings.workingDays, migratedSettings.skipSecondSaturday, migratedSettings.classesConfig]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // When scheduling settings change, regenerate the full schedule
      const nonManualKeys = new Set(
        tasks.filter((t) => !t.isManual).map((t) => `${t.classId}-${t.copyType}`)
      );
      // Drop all non-manual tasks and regenerate
      const manualTasks = tasks.filter((t) => t.isManual);
      const fresh = generateSchedule(updated, manualTasks);
      setTasks(fresh);
      return updated;
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const addTask = (task: Task) => {
    setTasks((prev) => {
      // Avoid exact duplicate id
      if (prev.some((t) => t.id === task.id)) return prev;
      return [...prev, task];
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
    return tasks.filter(
      (t) => t.assignedDate < today && t.status === "pending"
    );
  };

  const value = useMemo(
    () => ({
      settings: migratedSettings,
      updateSettings,
      tasks,
      updateTask,
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
  if (!context) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return context;
}
