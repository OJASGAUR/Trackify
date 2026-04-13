import {
  format,
  addDays,
  addMonths,
  getDay,
  isBefore,
  parseISO,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfMonth,
} from "date-fns";
import { AppSettings, Task, ClassName, CopyType } from "./types";

export function getCurrentDate(settings: AppSettings): Date {
  return settings.testDate ? parseISO(settings.testDate) : new Date();
}

export function isSecondSaturday(date: Date): boolean {
  if (getDay(date) !== 6) return false;
  const d = date.getDate();
  return d >= 8 && d <= 14;
}

export function isWorkingDay(date: Date, settings: AppSettings): boolean {
  const dow = getDay(date);
  if (!settings.workingDays.includes(dow)) return false;
  if (settings.skipSecondSaturday && isSecondSaturday(date)) return false;
  return true;
}

interface ComboSlot {
  classId: ClassName;
  copyType: CopyType;
  partIndex: number;
  totalParts: number;
  partTotal: number;
  partStart: number;
}

/**
 * Build slots in a MIXED, interleaved order so the two parts of the same class
 * are spread apart with other classes in between.
 *
 * Order: for each part round → for each copyType → for each class
 * Result: [6A-HW-1, 6B-HW-1, ..., 6A-CW-1, 6B-CW-1, ..., 6A-HW-2, 6B-HW-2, ...]
 */
function buildAllSlots(settings: AppSettings): ComboSlot[] {
  const perDay = Math.max(1, settings.defaultCopiesPerDay);
  const classes = settings.classesConfig;
  const maxParts = Math.max(
    ...classes.map((c) => Math.max(1, Math.ceil(c.studentsCount / perDay)))
  );

  const slots: ComboSlot[] = [];

  for (let p = 1; p <= maxParts; p++) {
    for (const copyType of ["Homework", "Classwork"] as CopyType[]) {
      for (const c of classes) {
        const totalParts = Math.max(1, Math.ceil(c.studentsCount / perDay));
        if (p > totalParts) continue;
        const partStart = (p - 1) * perDay + 1;
        const partEnd = Math.min(p * perDay, c.studentsCount);
        slots.push({
          classId: c.id as ClassName,
          copyType,
          partIndex: p,
          totalParts,
          partTotal: partEnd - partStart + 1,
          partStart,
        });
      }
    }
  }

  return slots;
}

/** Working day strings for a single month */
function collectWorkingDatesInMonth(settings: AppSettings, monthDate: Date, fromDate?: Date): string[] {
  const start = fromDate && format(monthDate, "yyyy-MM") === format(fromDate, "yyyy-MM")
    ? (isBefore(monthDate, fromDate) ? fromDate : monthDate)
    : monthDate;

  return eachDayOfInterval({ start, end: endOfMonth(monthDate) })
    .filter((d) => isWorkingDay(d, settings))
    .map((d) => format(d, "yyyy-MM-dd"));
}

/** Sunday fallbacks within a single month */
function collectSundayFallbacksInMonth(monthDate: Date): string[] {
  return eachDayOfInterval({ start: monthDate, end: endOfMonth(monthDate) })
    .filter((d) => getDay(d) === 0)
    .map((d) => format(d, "yyyy-MM-dd"));
}

/** Maximum auto-tasks allowed on a single day */
const MAX_PER_DAY = 2;

interface MonthlySlot extends ComboSlot {
  monthKey: string;
}

function buildMonthlySlots(settings: AppSettings): MonthlySlot[] {
  const allSlots = buildAllSlots(settings);
  const today = parseISO(format(getCurrentDate(settings), "yyyy-MM-dd"));
  const startDate = parseISO(settings.startDate);
  const from = isBefore(startDate, today) ? today : startDate;
  const horizon = addMonths(startOfMonth(from), 11);

  return eachMonthOfInterval({ start: startOfMonth(from), end: horizon }).flatMap((monthDate) => {
    const monthKey = format(monthDate, "yyyy-MM");
    return allSlots.map((slot) => ({ ...slot, monthKey }));
  });
}

function choosePreferredTask(a: Task, b: Task): Task {
  const rank: Record<Task["status"], number> = {
    pending: 1,
    partial: 2,
    checked: 3,
    skipped: 3,
  };
  if (rank[a.status] !== rank[b.status]) return rank[a.status] > rank[b.status] ? a : b;
  return a.checkedCount >= b.checkedCount ? a : b;
}

export function generateSchedule(settings: AppSettings, existingTasks: Task[] = []): Task[] {
  const today = parseISO(format(getCurrentDate(settings), "yyyy-MM-dd"));
  const startDate = parseISO(settings.startDate);
  const from = isBefore(startDate, today) ? today : startDate;
  const monthStarts = eachMonthOfInterval({ start: startOfMonth(from), end: addMonths(startOfMonth(from), 11) });
  const monthlySlots = monthStarts.flatMap((monthDate) => {
    const monthKey = format(monthDate, "yyyy-MM");
    return buildAllSlots(settings).map((slot) => ({ ...slot, monthKey }));
  });

  const dedupedTasks: Task[] = [];
  const autoTaskMap = new Map<string, Task>();

  for (const task of existingTasks) {
    if (!task.assignedDate) continue;
    if (task.isManual) {
      dedupedTasks.push(task);
      continue;
    }
    if (task.partIndex === undefined) continue;

    const taskMonthKey = format(parseISO(task.assignedDate), "yyyy-MM");
    const idMonthCandidate = task.id.split("-").slice(-1)[0];
    const hasIdMonth = /^\d{4}-\d{2}$/.test(idMonthCandidate);
    if (hasIdMonth && idMonthCandidate !== taskMonthKey) continue;

    const key = `${task.classId}-${task.copyType}-pt${task.partIndex}-${taskMonthKey}`;
    const existing = autoTaskMap.get(key);
    autoTaskMap.set(key, existing ? choosePreferredTask(task, existing) : task);
  }

  dedupedTasks.push(...autoTaskMap.values());

  const scheduledKeys = new Set<string>([...autoTaskMap.keys()]);
  const unscheduledByMonth = new Map<string, MonthlySlot[]>();

  for (const slot of monthlySlots) {
    const key = `${slot.classId}-${slot.copyType}-pt${slot.partIndex}-${slot.monthKey}`;
    if (!scheduledKeys.has(key)) {
      unscheduledByMonth.set(slot.monthKey, [...(unscheduledByMonth.get(slot.monthKey) ?? []), slot]);
    }
  }

  if (unscheduledByMonth.size === 0) return dedupedTasks;

  const assignmentCounts = new Map<string, number>();
  for (const task of dedupedTasks) {
    if (!task.assignedDate) continue;
    assignmentCounts.set(task.assignedDate, (assignmentCounts.get(task.assignedDate) ?? 0) + 1);
  }

  const generatedTasks: Task[] = [];

  for (const monthDate of monthStarts) {
    const monthKey = format(monthDate, "yyyy-MM");
    const slots = unscheduledByMonth.get(monthKey) ?? [];
    if (!slots.length) continue;

    const monthStart = monthDate;
    const monthFrom = format(monthStart, "yyyy-MM") === format(from, "yyyy-MM") ? from : monthStart;
    const workingDates = collectWorkingDatesInMonth(settings, monthStart, monthFrom);
    const datePool = [...workingDates];

    if (workingDates.length * MAX_PER_DAY < slots.length) {
      for (const d of collectSundayFallbacksInMonth(monthStart)) {
        if (!datePool.includes(d)) datePool.push(d);
        if (datePool.length * MAX_PER_DAY >= slots.length) break;
      }
    }

    datePool.sort((a, b) => a.localeCompare(b));
    const M = datePool.length;
    const N = slots.length;

    // chunk into weeks (6 is number of classes typically)
    const chunkSize = 6;
    const chunks: (typeof slots)[] = [];
    for (let i = 0; i < N; i += chunkSize) {
      chunks.push(slots.slice(i, i + chunkSize));
    }
    const numChunks = chunks.length;

    let dateIndex = 0;

    for (let c = 0; c < numChunks; c++) {
      const chunk = chunks[c];
      
      let chunkStartIndex: number;
      if (numChunks * chunkSize <= M) {
        // distribute chunks evenly across available days
        chunkStartIndex = Math.floor((c * M) / numChunks);
      } else {
        // dense fallback
        chunkStartIndex = dateIndex;
      }

      for (let i = 0; i < chunk.length; i++) {
        const slot = chunk[i];
        
        let date: string;
        if (numChunks * chunkSize <= M) {
          // just read sequentially from chunk start
          date = datePool[Math.min(chunkStartIndex + i, M - 1)];
        } else {
          // dense distribution fallback based on lowest assignment counts
          const sortedDates = [...datePool].sort((a, b) => {
            const countA = assignmentCounts.get(a) ?? 0;
            const countB = assignmentCounts.get(b) ?? 0;
            if (countA !== countB) return countA - countB;
            return a.localeCompare(b);
          });
          date = sortedDates[0];
        }

        generatedTasks.push({
          id: `${slot.classId}-${slot.copyType}-pt${slot.partIndex}-${slot.monthKey}`,
          classId: slot.classId,
          copyType: slot.copyType,
          assignedDate: date,
          status: "pending",
          checkedCount: 0,
          isManual: false,
          partIndex: slot.partIndex,
          totalParts: slot.totalParts,
          partTotal: slot.partTotal,
          partStart: slot.partStart,
        });

        assignmentCounts.set(date, (assignmentCounts.get(date) ?? 0) + 1);
        dateIndex++;
      }
    }
  }

  return [...dedupedTasks, ...generatedTasks];
}
