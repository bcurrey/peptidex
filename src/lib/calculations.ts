import { AppState, DoseLog, InventoryItem, Peptide, Protocol, ScheduledDose } from "../types";

const dayMs = 24 * 60 * 60 * 1000;

export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const daysBetween = (start: string, end: string) => {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / dayMs));
};

export const getPeptide = (peptides: Peptide[], id: string) => peptides.find((p) => p.id === id);

const unitsToDays = (value: number, unit = "days") => value * (unit === "weeks" ? 7 : 1);

export const getCurrentTitrationPhase = (item: Protocol["items"][number], protocolStartDate: string, date = new Date()) => {
  if (item.doseType !== "Titration Protocol" || !item.titrationPhases?.length) return null;
  let cursor = new Date(`${item.titrationPhases[0].startDate || protocolStartDate}T00:00:00`);
  const target = new Date(`${toDateKey(date)}T00:00:00`);
  for (const phase of item.titrationPhases) {
    const phaseStart = phase.startDate ? new Date(`${phase.startDate}T00:00:00`) : cursor;
    const phaseEnd = new Date(phaseStart);
    phaseEnd.setDate(phaseEnd.getDate() + unitsToDays(phase.duration || 1, phase.durationUnit));
    if (target >= phaseStart && target < phaseEnd) return phase;
    cursor = phaseEnd;
  }
  return item.titrationPhases[item.titrationPhases.length - 1];
};

export const getCycleStatus = (item: Protocol["items"][number], date = new Date()) => {
  const cycling = item.cycling;
  if (!cycling?.enabled) return { isActive: true, label: "Active", daysLeft: null as number | null };
  const activeDays = unitsToDays(cycling.activeLength || 1, cycling.unit);
  const offDays = unitsToDays(cycling.offLength || 0, cycling.unit);
  const cycleDays = Math.max(1, activeDays + offDays);
  const start = new Date(`${cycling.cycleStartDate}T00:00:00`);
  const current = new Date(`${toDateKey(date)}T00:00:00`);
  const elapsed = Math.max(0, Math.floor((current.getTime() - start.getTime()) / dayMs));
  const position = cycling.repeat ? elapsed % cycleDays : elapsed;
  const isActive = position < activeDays;
  const daysLeft = isActive ? activeDays - position : cycleDays - position;
  return { isActive, label: isActive ? "Active phase" : "Off phase", daysLeft };
};

export const generateScheduledDoses = (protocols: Protocol[], peptides: Peptide[], rangeStart: Date, rangeEnd: Date) => {
  const doses: ScheduledDose[] = [];
  protocols
    .filter((protocol) => !protocol.paused && !protocol.completed)
    .forEach((protocol) => {
      const start = new Date(`${protocol.cycleStartDate}T00:00:00`);
      const end = protocol.noEndDate ? rangeEnd : new Date(`${protocol.cycleEndDate}T23:59:59`);
      const cursor = new Date(Math.max(start.getTime(), rangeStart.getTime()));
      const stop = new Date(Math.min(end.getTime(), rangeEnd.getTime()));
      while (cursor <= stop) {
        protocol.items.forEach((item) => {
          const cycle = getCycleStatus(item, cursor);
          if (!cycle.isActive) return;
          if (item.schedule.frequencyType === "Interval") {
            const elapsed = Math.floor((new Date(`${toDateKey(cursor)}T00:00:00`).getTime() - start.getTime()) / dayMs);
            const interval = Math.max(1, item.schedule.intervalEvery || 1);
            if (elapsed % interval !== 0) return;
          }
          if (!item.schedule.daysOfWeek.includes(cursor.getDay())) return;
          const peptide = getPeptide(peptides, item.peptideId);
          if (!peptide) return;
          const phase = getCurrentTitrationPhase(item, protocol.cycleStartDate, cursor);
          item.schedule.preferredTimes.forEach((time) => {
            const scheduledAt = `${toDateKey(cursor)}T${time}:00`;
            doses.push({
              id: `${protocol.id}-${item.id}-${toDateKey(cursor)}-${time}`,
              protocolId: protocol.id,
              protocolItemId: item.id,
              peptideId: item.peptideId,
              scheduledAt,
              doseAmount: phase?.amount || item.doseAmount,
              doseUnit: phase?.unit || item.doseUnit || peptide.doseUnit,
              instructions: item.instructions,
              method: item.method,
              phaseName: phase?.name,
            });
          });
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    });
  return doses.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
};

export const vialMathForItem = (item: Protocol["items"][number]) => {
  const vial = item.vialTracking;
  if (!vial?.enabled) return null;
  const total = Number(vial.totalAmount || 0);
  const volume = Number(vial.reconstitutionVolume || 0);
  const remaining = Number(vial.remainingSupply || vial.startingSupply || vial.totalAmount || 0);
  const plannedDose = Number(item.doseAmount || 0);
  const concentration = volume ? total / volume : 0;
  const dosesRemaining = plannedDose ? Math.floor(remaining / plannedDose) : 0;
  const lowThreshold = Number(vial.lowSupplyThreshold || 0);
  return {
    concentration: Number(concentration.toFixed(2)),
    remaining,
    dosesRemaining,
    lowSupply: lowThreshold > 0 && dosesRemaining <= lowThreshold,
    daysLeft: dosesRemaining,
  };
};

export const getLogForDose = (logs: DoseLog[], doseId: string) => logs.find((log) => log.scheduledDoseId === doseId);

export const statusForDose = (dose: ScheduledDose, logs: DoseLog[]) => {
  const log = getLogForDose(logs, dose.id);
  if (log) return log.status;
  return new Date(dose.scheduledAt).getTime() < Date.now() ? "missed" : "snoozed";
};

export const calculateCompliance = (logs: DoseLog[]) => {
  if (!logs.length) return 0;
  const successful = logs.filter((log) => log.status === "taken").length;
  return Math.round((successful / logs.length) * 100);
};

export const calculateCurrentStreak = (logs: DoseLog[]) => {
  const takenDays = new Set(logs.filter((log) => log.status === "taken").map((log) => log.loggedAt.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (takenDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const calculateBestStreak = (logs: DoseLog[]) => {
  const days = Array.from(new Set(logs.filter((log) => log.status === "taken").map((log) => log.loggedAt.slice(0, 10)))).sort();
  let best = 0;
  let current = 0;
  let previous = "";
  days.forEach((day) => {
    if (!previous || daysBetween(previous, day) === 1) current += 1;
    else current = 1;
    best = Math.max(best, current);
    previous = day;
  });
  return best;
};

export const getAppStats = (state: AppState) => {
  const totalDoses = state.doseLogs.length;
  return {
    totalDoses,
    compliance: calculateCompliance(state.doseLogs),
    currentStreak: calculateCurrentStreak(state.doseLogs),
    bestStreak: calculateBestStreak(state.doseLogs),
  };
};

export const timeWindow = (iso: string) => {
  const hour = new Date(iso).getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "before bed";
};

export const metricEntriesFor = (state: AppState, metricId: string) =>
  state.metricEntries
    .filter((entry) => entry.metricId === metricId)
    .sort((a, b) => a.date.localeCompare(b.date));

export const metricTrend = (state: AppState, metricId: string) => {
  const entries = metricEntriesFor(state, metricId)
    .map((entry) => Number(entry.value))
    .filter((value) => Number.isFinite(value));
  if (entries.length < 3) return null;
  const first = entries[0];
  const last = entries[entries.length - 1];
  const change = Number((last - first).toFixed(1));
  const average = Number((entries.reduce((sum, value) => sum + value, 0) / entries.length).toFixed(1));
  return { first, last, change, average, count: entries.length };
};

export const weeklyAverage = (state: AppState, metricId: string) => {
  const recent = metricEntriesFor(state, metricId)
    .slice(-7)
    .map((entry) => Number(entry.value))
    .filter((value) => Number.isFinite(value));
  if (!recent.length) return null;
  return Number((recent.reduce((sum, value) => sum + value, 0) / recent.length).toFixed(1));
};

export const generateInsights = (state: AppState) => {
  const stats = getAppStats(state);
  const insights = [];
  const weightTrend = metricTrend(state, "metric-weight");
  const moodTrend = metricTrend(state, "metric-mood");
  const energyTrend = metricTrend(state, "metric-energy");
  const sleepTrend = metricTrend(state, "metric-sleep-quality");
  const missedWeekend = state.doseLogs.filter((log) => {
    const day = new Date(log.loggedAt).getDay();
    return log.status !== "taken" && (day === 0 || day === 6);
  }).length;

  if (weightTrend) insights.push(`Weight entries changed ${Math.abs(weightTrend.change)} lb across the selected logged period.`);
  if (moodTrend && sleepTrend) {
    insights.push("Mood and sleep both have enough entries to compare trends.");
  } else if (moodTrend) {
    insights.push(`Mood is trending ${moodTrend.change >= 0 ? "up" : "down"} across ${moodTrend.count} logs.`);
  }
  if (energyTrend) {
    insights.push(`Energy entries changed ${Math.abs(energyTrend.change)} points across the selected logged period.`);
  }
  insights.push("No trend yet for some modules - log more data to compare them.");
  if (missedWeekend > 0) {
    insights.push("You tend to miss doses more often on weekends.");
  } else {
    insights.push("Weekend dose logs are currently consistent with weekday logs.");
  }
  return insights;
};

export const chartSeriesForMetric = (state: AppState, metricId: string, limit = 12) =>
  metricEntriesFor(state, metricId)
    .slice(-limit)
    .map((entry) => ({ label: new Date(entry.date).toLocaleDateString([], { month: "short", day: "numeric" }), value: Number(entry.value) || 0 }));

export const movingAverage = (values: number[], windowSize = 3) =>
  values.map((_, index) => {
    const slice = values.slice(Math.max(0, index - windowSize + 1), index + 1);
    return Number((slice.reduce((sum, value) => sum + value, 0) / slice.length).toFixed(1));
  });

export const bestWorstPeriod = (values: number[]) => {
  if (!values.length) return { best: 0, worst: 0 };
  return { best: Math.max(...values), worst: Math.min(...values) };
};

export const calculateScores = (state: AppState) => {
  const stats = getAppStats(state);
  const sleepEntries = metricEntriesFor(state, "metric-sleep-quality");
  const moodEntries = metricEntriesFor(state, "metric-mood");
  const sleep = Number(sleepEntries[sleepEntries.length - 1]?.value || 8) * 10;
  const mood = Number(moodEntries[moodEntries.length - 1]?.value || 8) * 10;
  const painEntries = metricEntriesFor(state, "metric-pain");
  const recoveryPain = Number(painEntries[painEntries.length - 1]?.value || 2);
  const recovery = Math.max(0, 100 - recoveryPain * 8);
  const activity = state.metricConfigs.some((metric) => metric.id === "metric-steps" && metric.enabled) ? 82 : 76;
  const daily = Math.round((stats.compliance + sleep + mood + recovery + activity) / 5);
  return {
    daily,
    weekly: Math.round((daily + stats.compliance) / 2),
    recovery,
    consistency: stats.compliance,
    factors: [
      `Adherence contributes ${stats.compliance}%`,
      `Sleep score contributes ${Math.round(sleep)}%`,
      `Mood score contributes ${Math.round(mood)}%`,
      `Recovery score contributes ${Math.round(recovery)}%`,
    ],
  };
};

export const inventoryMath = (item: InventoryItem, plannedDoseMg = 2) => {
  const concentration = item.bacWaterMl ? item.vialAmountMg / item.bacWaterMl : 0;
  const remainingMg = concentration * item.remainingVolumeMl;
  const dosesRemaining = plannedDoseMg ? Math.floor(remainingMg / plannedDoseMg) : 0;
  const refillDate = new Date();
  refillDate.setDate(refillDate.getDate() + Math.max(1, dosesRemaining));
  return {
    concentration: Number(concentration.toFixed(2)),
    remainingMg: Number(remainingMg.toFixed(1)),
    dosesRemaining,
    lowSupply: dosesRemaining <= item.lowSupplyThresholdDoses,
    refillDate: refillDate.toISOString().slice(0, 10),
    syringeUnitsPerMg: concentration ? Number((100 / concentration).toFixed(1)) : 0,
  };
};

export const changeDetection = (state: AppState) => {
  const weight = metricTrend(state, "metric-weight");
  const sleep = metricTrend(state, "metric-sleep-quality");
  const mood = metricTrend(state, "metric-mood");
  const sideEffects = state.metricEntries.filter((entry) => {
    const metric = state.metricConfigs.find((config) => config.id === entry.metricId);
    return metric?.category === "Side Effects" && Number(entry.value) > 4;
  }).length;
  const cards = [];
  if (weight && Math.abs(weight.change) < 0.4) cards.push("Weight entries are mostly flat in the selected logs.");
  if (sleep && sleep.change < 0) cards.push("Sleep entries decreased across the selected logged period.");
  if (mood && mood.change > 0) cards.push("Mood entries increased across the selected logged period.");
  if (getAppStats(state).compliance > 90) cards.push("Adherence is above 90% for the current logs.");
  if (sideEffects > 1) cards.push("Side effects increased. Keep tracking symptoms and notes.");
  return cards.length ? cards : ["No trend yet - log more data to compare changes."];
};

export const exportJson = (state: AppState) => JSON.stringify(state, null, 2);

export const exportCsv = (state: AppState) => {
  const rows = [
    ["type", "date", "name", "value", "notes"],
    ...state.doseLogs.map((log) => ["dose", log.loggedAt, log.scheduledDoseId, log.status, log.notes]),
    ...state.metricEntries.map((entry) => {
      const metric = state.metricConfigs.find((config) => config.id === entry.metricId);
      return ["metric", entry.date, metric?.name || entry.metricId, String(entry.value), entry.notes || ""];
    }),
    ...state.journalEntries.map((entry) => ["journal", entry.date, entry.title, entry.type, entry.body]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
};
