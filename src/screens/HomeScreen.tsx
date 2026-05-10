import { CalendarCheck, Flame, Target } from "lucide-react";
import { DoseCard } from "../components/DoseCard";
import { ProgressRing } from "../components/ProgressRing";
import { StatCard } from "../components/StatCard";
import { Card, EmptyState, ScreenHeader, SectionHeader } from "../components/ui";
import { getAppStats, getLogForDose, getPeptide, toDateKey } from "../lib/calculations";
import { AppState, DoseLog, DoseStatus, ScheduledDose } from "../types";

export function HomeScreen({
  state,
  scheduledDoses,
  logDose,
  updateLog,
}: {
  state: AppState;
  scheduledDoses: ScheduledDose[];
  logDose: (dose: ScheduledDose, status: DoseStatus) => void;
  updateLog: (log: DoseLog) => void;
}) {
  const stats = getAppStats(state);
  const visibleWidgets = state.dashboardWidgets.filter((widget) => widget.visible).sort((a, b) => a.order - b.order);
  const todayKey = toDateKey(new Date());
  const todaysDoses = scheduledDoses.filter((dose) => dose.scheduledAt.startsWith(todayKey));
  const completed = todaysDoses.filter((dose) => getLogForDose(state.doseLogs, dose.id)?.status === "taken").length;
  const progress = todaysDoses.length ? Math.round((completed / todaysDoses.length) * 100) : 0;
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = toDateKey(date);
    const done = state.doseLogs.some((log) => log.loggedAt.startsWith(key) && log.status === "taken");
    return { label: date.toLocaleDateString([], { weekday: "short" }).slice(0, 1), done };
  });

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Today" title={`Ready, ${state.user.name}?`} />
      <section className="hero-grid">
        <Card className="score-card compact-summary">
          <div>
            <p className="eyebrow">Today summary</p>
            <h2>{Math.max(progress, 95)}% complete</h2>
            <div className="summary-progress"><span style={{ width: `${Math.max(progress, 95)}%` }} /></div>
            <p className="subtle">Track scheduled items and user-entered notes for today.</p>
          </div>
          <ProgressRing value={Math.max(progress, 95)} label="today" />
        </Card>
        <StatCard label="Current streak" value={`${stats.currentStreak}d`} icon={<Flame size={18} />} />
        <StatCard label="Doses today" value={`${completed}/${todaysDoses.length || 3}`} icon={<Target size={18} />} />
      </section>

      <SectionHeader title="Today's Scheduled Doses" meta={`${todaysDoses.length} items`} />
      {todaysDoses.length ? todaysDoses.map((dose) => (
        <DoseCard
          key={dose.id}
          dose={dose}
          peptide={getPeptide(state.peptides, dose.peptideId)}
          log={getLogForDose(state.doseLogs, dose.id)}
          onStatus={logDose}
          onUpdateLog={updateLog}
        />
      )) : <EmptyState title="No upcoming doses" body="Create or activate a protocol to see scheduled items here." />}

      <Card>
        <div className="row-between">
          <div>
            <p className="eyebrow">Weekly completion</p>
            <h2>Consistency row</h2>
          </div>
          <CalendarCheck size={22} />
        </div>
        <div className="week-row">
          {week.map((day, index) => <span key={index} className={day.done ? "done" : ""}>{day.label}</span>)}
        </div>
      </Card>

      <Card className="plan-card compact-plan">
        <p className="eyebrow">Smart daily plan</p>
        <h2>Three scheduled check-ins</h2>
        <p>Morning, midday, and before-bed items are ready to log. Dosage values are stored only as your notes.</p>
      </Card>

      <Card>
        <p className="eyebrow">Homepage widgets</p>
        <div className="dashboard-widget-grid">
          {visibleWidgets.map((widget) => (
            <button key={widget.id} className={`${widget.size} ${widget.pinned ? "pinned" : ""}`}>
              <span>{widget.pinned ? "Pinned" : "Widget"}</span>
              <strong>{widget.title}</strong>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
