import { Dispatch, SetStateAction } from "react";
import { Bell, CalendarCheck, Flame, Target } from "lucide-react";
import { DoseCard } from "../components/DoseCard";
import { DoseHistory } from "../components/DoseHistory";
import { ProgressRing } from "../components/ProgressRing";
import { StatCard } from "../components/StatCard";
import { Card, EmptyState, ScreenHeader, SectionHeader } from "../components/ui";
import { getAppStats, getLogForDose, getPeptide, toDateKey } from "../lib/calculations";
import { AppState, DoseLog, DoseStatus, ScheduledDose } from "../types";

export function HomeScreen({
  state,
  setState,
  scheduledDoses,
  logDose,
  updateLog,
  deleteScheduleItem,
  deleteLog,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  scheduledDoses: ScheduledDose[];
  logDose: (dose: ScheduledDose, status: DoseStatus) => void;
  updateLog: (log: DoseLog) => void;
  deleteScheduleItem: (dose: ScheduledDose) => void;
  deleteLog: (log: DoseLog) => void;
}) {
  const stats = getAppStats(state);
  const dashboardWidgets = (state.dashboardWidgets || []).sort((a, b) => a.order - b.order);
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
      <ScreenHeader eyebrow={new Date().toLocaleDateString([], { weekday: "long" })} title={`Good morning, ${state.user.name}`} action={<button className="icon-button" title="Reminder settings placeholder."><Bell size={18} /></button>} />
      <section className="hero-grid">
        <Card className="score-card compact-summary">
          <div>
            <p className="eyebrow">Today summary</p>
            <h2>{progress}% complete</h2>
            <div className="summary-progress"><span style={{ width: `${progress}%` }} /></div>
            <p className="subtle">Track scheduled items and user-entered notes for today.</p>
          </div>
          <ProgressRing value={progress} label="today" />
        </Card>
        <StatCard label="Current streak" value={`${stats.currentStreak}d`} icon={<Flame size={18} />} />
        <StatCard label="Doses today" value={`${completed}/${todaysDoses.length}`} icon={<Target size={18} />} />
      </section>

      <section id="todays-doses" className="anchor-section">
      <SectionHeader title="Today" />
      {todaysDoses.length ? todaysDoses.map((dose) => (
        <DoseCard
          key={dose.id}
          dose={dose}
          peptide={getPeptide(state.peptides, dose.peptideId)}
          log={getLogForDose(state.doseLogs, dose.id)}
          onStatus={logDose}
          onUpdateLog={updateLog}
          onDeleteScheduleItem={deleteScheduleItem}
        />
      )) : <EmptyState title="No upcoming doses" body="Create or activate a protocol to see scheduled items here." />}
      </section>

      <Card>
        <div className="row-between">
          <div>
            <p className="eyebrow">Weekly completion</p>
            <h2>Consistency row</h2>
          </div>
          <CalendarCheck size={22} />
        </div>
        <div className="week-row weekly-strip">
          {week.map((day, index) => <span key={index} className={day.done ? "done" : ""}>{day.label}</span>)}
        </div>
      </Card>

      <Card className="plan-card compact-plan">
        <p className="eyebrow">Smart daily plan</p>
        <h2>{todaysDoses.length ? `${todaysDoses.length} scheduled item${todaysDoses.length === 1 ? "" : "s"}` : "No active schedule"}</h2>
        <p>{todaysDoses.length ? "Your active protocol schedule is ready to log. Dosage values are stored only as your notes." : "Create a protocol when you are ready to schedule tracking reminders."}</p>
      </Card>

      <DoseHistory state={state} scheduledDoses={scheduledDoses} onUpdateLog={updateLog} onDeleteLog={deleteLog} />

      <Card>
        <p className="eyebrow">Homepage widgets</p>
        <div className="dashboard-widget-grid">
          {dashboardWidgets.map((widget) => (
            <button
              key={widget.id}
              className={`${widget.size} ${widget.pinned ? "pinned" : ""} ${widget.visible ? "active" : "disabled"}`}
              onClick={() => setState((current) => ({
                ...current,
                dashboardWidgets: current.dashboardWidgets.map((item) => item.id === widget.id ? { ...item, visible: !item.visible } : item),
              }))}
              title={`${widget.visible ? "Hide" : "Show"} ${widget.title} on the Home dashboard.`}
            >
              <span>{widget.visible ? "Shown" : "Hidden"}</span>
              <strong>{widget.title}</strong>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
