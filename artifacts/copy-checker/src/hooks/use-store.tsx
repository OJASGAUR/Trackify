import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { AppSettings, Task, DEFAULT_CLASSES } from "../lib/types";
import { generateSchedule } from "../lib/schedule";
import { format } from "date-fns";

interface StoreContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  resetData: () => void;
  getMissedPastTasks: () => Task[];
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AppSettings>("copy-checker-settings", {
    startDate: format(new Date(), "yyyy-MM-dd"),
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    classesConfig: DEFAULT_CLASSES,
  });

  const [tasks, setTasks] = useLocalStorage<Task[]>("copy-checker-tasks", []);

  // On mount or settings change, regenerate schedule if missing tasks
  useEffect(() => {
    const newTasks = generateSchedule(settings, tasks);
    if (newTasks.length > tasks.length) {
      setTasks(newTasks);
    }
  }, [settings, tasks, setTasks]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const resetData = () => {
    setSettings({
      startDate: format(new Date(), "yyyy-MM-dd"),
      workingDays: [1, 2, 3, 4, 5, 6],
      classesConfig: DEFAULT_CLASSES,
    });
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
      settings,
      updateSettings,
      tasks,
      updateTask,
      resetData,
      getMissedPastTasks,
    }),
    [settings, tasks]
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
