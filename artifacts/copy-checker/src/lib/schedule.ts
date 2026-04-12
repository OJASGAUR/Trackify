import { format, addDays, getDay, isAfter, isBefore, parseISO } from "date-fns";
import { AppSettings, Task, ClassName, CopyType } from "./types";

export function isSecondSaturday(date: Date): boolean {
  if (getDay(date) !== 6) return false;
  const day = date.getDate();
  return day >= 8 && day <= 14;
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
  partTotal: number; // copies in this part
  partStart: number; // 1-based start student index
}

/** Build a flat list of all task slots, splitting each class×type into N parts */
function buildAllSlots(settings: AppSettings): ComboSlot[] {
  const slots: ComboSlot[] = [];
  const perDay = Math.max(1, settings.defaultCopiesPerDay);

  settings.classesConfig.forEach((c) => {
    const totalStudents = c.studentsCount;
    const parts = Math.max(1, Math.ceil(totalStudents / perDay));

    (["Homework", "Classwork"] as CopyType[]).forEach((copyType) => {
      for (let p = 1; p <= parts; p++) {
        const partStart = (p - 1) * perDay + 1;
        const partEnd = Math.min(p * perDay, totalStudents);
        const partTotal = partEnd - partStart + 1;
        slots.push({
          classId: c.id as ClassName,
          copyType,
          partIndex: p,
          totalParts: parts,
          partTotal,
          partStart,
        });
      }
    });
  });
  return slots;
}

/** Collect working day date strings from startDate onward (today inclusive) */
function collectWorkingDates(settings: AppSettings, need: number): string[] {
  const startDate = parseISO(settings.startDate);
  const today = parseISO(format(new Date(), "yyyy-MM-dd"));
  // Start from whichever is later: startDate or today
  const from = isBefore(startDate, today) ? today : startDate;

  const dates: string[] = [];
  let current = from;
  while (dates.length < need + 10) {
    if (isWorkingDay(current, settings)) {
      dates.push(format(current, "yyyy-MM-dd"));
    }
    current = addDays(current, 1);
    // safety: stop after scanning 180 days
    if (dates.length === 0 && current > addDays(from, 180)) break;
    if (current > addDays(from, 365)) break;
  }
  return dates;
}

/** Collect future Sundays (after today) as overflow fallback */
function collectSundayFallbacks(count: number): string[] {
  const today = parseISO(format(new Date(), "yyyy-MM-dd"));
  const dates: string[] = [];
  let current = addDays(today, 1);
  while (dates.length < count) {
    if (getDay(current) === 0 && isAfter(current, today)) {
      dates.push(format(current, "yyyy-MM-dd"));
    }
    current = addDays(current, 1);
    if (current > addDays(today, 365)) break;
  }
  return dates;
}

export function generateSchedule(settings: AppSettings, existingTasks: Task[] = []): Task[] {
  const allSlots = buildAllSlots(settings);

  // Determine which slots are already scheduled (non-manual tasks with partIndex = v2 format)
  const scheduledKeys = new Set(
    existingTasks
      .filter((t) => !t.isManual && t.partIndex !== undefined)
      .map((t) => t.id)
  );

  const unscheduled = allSlots.filter(
    (s) => !scheduledKeys.has(`${s.classId}-${s.copyType}-pt${s.partIndex}`)
  );

  if (unscheduled.length === 0) return [...existingTasks];

  // Get working days
  const workingDates = collectWorkingDates(settings, unscheduled.length);

  // If still not enough, pad with Sunday fallbacks
  const sundayFallbacks = collectSundayFallbacks(Math.max(10, unscheduled.length));
  const scheduleDates = [...workingDates];
  let si = 0;
  while (scheduleDates.length < unscheduled.length && si < sundayFallbacks.length) {
    const d = sundayFallbacks[si++];
    if (!scheduleDates.includes(d)) scheduleDates.push(d);
  }

  // Assign one slot per day, one after another
  const newTasks: Task[] = unscheduled.map((slot, idx) => {
    const dateStr = scheduleDates[idx % scheduleDates.length];
    return {
      id: `${slot.classId}-${slot.copyType}-pt${slot.partIndex}`,
      classId: slot.classId,
      copyType: slot.copyType,
      assignedDate: dateStr,
      status: "pending",
      checkedCount: 0,
      isManual: false,
      partIndex: slot.partIndex,
      totalParts: slot.totalParts,
      partTotal: slot.partTotal,
      partStart: slot.partStart,
    };
  });

  return [...existingTasks, ...newTasks];
}
