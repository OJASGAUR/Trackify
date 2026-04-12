import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
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

  // Ensure migrated defaults exist
  const migratedSettings: AppSettings = {
    skipSecondSaturday: true,
    workingDays: [1, 2, 3, 4, 5, 6],
    defaultCopiesPerDay: 20,
    ...settings,
  };

  const [tasks, setTasks] = useLocalStorage<Task[]>("copy-checker-tasks", []);

  // Track whether we've already done the initial regeneration this session
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Detect old-format tasks: non-manual tasks without partIndex are v1 format
    const hasOldFormat = tasks.some((t) => !t.isManual && t.partIndex === undefined);

    if (hasOldFormat) {
      // Keep manual tasks + already-marked auto tasks (don't lose progress)
      const keepTasks = tasks.filter((t) => t.isManual || t.status !== "pending");
      const fresh = generateSchedule(migratedSettings, keepTasks);
      setTasks(fresh);
    } else {
      // Normal: add any missing slots
      const newTasks = generateSchedule(migratedSettings, tasks);
      if (newTasks.length > tasks.length) {
        setTasks(newTasks);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // Drop all pending non-manual tasks and regenerate with new settings
      const keepTasks = tasks.filter((t) => t.isManual || t.status !== "pending");
      const fresh = generateSchedule(updated, keepTasks);
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
