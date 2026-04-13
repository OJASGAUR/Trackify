import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "./use-local-storage";
import { AppSettings, Task, DEFAULT_SETTINGS } from "../lib/types";
import { generateSchedule, getCurrentDate, isWorkingDay } from "../lib/schedule";
import { format, parseISO } from "date-fns";
import { isSupabaseConfigured } from "../lib/supabase";
import { loadRemoteStore, saveRemoteStore } from "../lib/remote-store";

interface StoreContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  bulkUpdateTasks: (filter: (task: Task) => boolean, updater: (task: Task) => Partial<Task>) => void;
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
    ...DEFAULT_SETTINGS,
    ...settings,
  };

  const [tasks, setTasks] = useLocalStorage<Task[]>("copy-checker-tasks", []);
  const [remoteReady, setRemoteReady] = useState(false);
  const didInitRef = useRef(false);
  const remoteHydratedRef = useRef(false);
  const useRemoteStore = isSupabaseConfigured && import.meta.env.VITE_USE_SUPABASE === "true";

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const initializeStore = async () => {
      let initialSettings = settings;
      let initialTasks = tasks;

      if (useRemoteStore) {
        const [remoteSettings, remoteTasks] = await Promise.all([
          loadRemoteStore<AppSettings>("settings"),
          loadRemoteStore<Task[]>("tasks"),
        ]);

        if (remoteSettings) {
          initialSettings = remoteSettings;
          setSettings(remoteSettings);
        }
        if (remoteTasks) {
          initialTasks = remoteTasks;
          setTasks(remoteTasks);
        }
      }

      const validTasks = initialTasks.filter((t) => t.assignedDate);
      const latestSettings = { ...DEFAULT_SETTINGS, ...initialSettings };

      const hasOldFormat = validTasks.some((t) => !t.isManual && t.partIndex === undefined);
      const hasTasksOnWrongDays = validTasks.some(
        (t) =>
          !t.isManual &&
          t.status === "pending" &&
          !isWorkingDay(parseISO(t.assignedDate), latestSettings)
      );

      if (hasOldFormat || hasTasksOnWrongDays) {
        const keepTasks = validTasks.filter((t) => t.isManual || t.status !== "pending");
        const fresh = generateSchedule(latestSettings, keepTasks);
        setTasks(fresh);
      } else {
        const newTasks = generateSchedule(latestSettings, validTasks);
        if (newTasks.length !== validTasks.length) setTasks(newTasks);
      }

      remoteHydratedRef.current = true;
      setRemoteReady(true);
    };

    initializeStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      const hasNonTestDateChanges =
        prev.startDate !== updated.startDate ||
        prev.defaultCopiesPerDay !== updated.defaultCopiesPerDay ||
        prev.skipSecondSaturday !== updated.skipSecondSaturday ||
        JSON.stringify(prev.workingDays) !== JSON.stringify(updated.workingDays) ||
        JSON.stringify(prev.classesConfig) !== JSON.stringify(updated.classesConfig);

      const keepTasks = prev.testDate !== updated.testDate && !hasNonTestDateChanges
        ? tasks.filter((t) => t.assignedDate)
        : tasks.filter((t) => t.isManual || t.status !== "pending");

      const fresh = generateSchedule(updated, keepTasks);
      setTasks(fresh);
      return updated;
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  const bulkUpdateTasks = (
    filter: (task: Task) => boolean,
    updater: (task: Task) => Partial<Task>
  ) => {
    setTasks((prev) => prev.map((t) => (filter(t) ? { ...t, ...updater(t) } : t)));
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
    const today = format(getCurrentDate(migratedSettings), "yyyy-MM-dd");
    return tasks.filter((t) => t.assignedDate < today && t.status === "pending");
  };

  useEffect(() => {
    if (!useRemoteStore || !remoteHydratedRef.current) return;
    saveRemoteStore("settings", migratedSettings);
    saveRemoteStore("tasks", tasks);
  }, [migratedSettings, tasks, useRemoteStore]);

  const value = useMemo(
    () => ({
      settings: migratedSettings,
      updateSettings,
      tasks,
      updateTask,
      bulkUpdateTasks,
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
