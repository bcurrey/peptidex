import { Dispatch, SetStateAction } from "react";
import { BadgeCheck, UserRound } from "lucide-react";
import { AchievementBadge } from "../components/AchievementBadge";
import { GoalChip } from "../components/GoalChip";
import { StatCard } from "../components/StatCard";
import { Button, Card, Input, ScreenHeader, Select, Textarea } from "../components/ui";
import { getAppStats } from "../lib/calculations";
import { AppState, BodyMetricEntry, Goal } from "../types";

const goals: Goal[] = ["Muscle Recovery", "Better Sleep", "Cognitive Edge", "Anti-Aging", "Fat Loss", "Immune Support", "Joint Health", "Stress Reduction"];
const achievementLabels = ["First Dose", "7-Day Streak", "30-Day Streak", "100 Doses Logged", "Perfect Week", "Protocol Creator"];

export function ProfileScreen({ state, setState, onBack }: { state: AppState; setState: Dispatch<SetStateAction<AppState>>; onBack?: () => void }) {
  const stats = getAppStats(state);
  const metric = state.bodyMetrics[0] || { id: "metric-new", date: new Date().toISOString().slice(0, 10) };

  const updateMetric = (patch: Partial<BodyMetricEntry>) => {
    const next = { ...metric, ...patch };
    setState((current) => ({ ...current, bodyMetrics: [next, ...current.bodyMetrics.filter((m) => m.id !== next.id)] }));
  };

  const toggleGoal = (goal: Goal) => {
    setState((current) => ({
      ...current,
      user: {
        ...current.user,
        goals: current.user.goals.includes(goal) ? current.user.goals.filter((g) => g !== goal) : [...current.user.goals, goal],
      },
    }));
  };

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Account" title="Profile" action={onBack ? <Button variant="ghost" onClick={onBack}>Back</Button> : undefined} />
      <Card className="profile-card">
        <div className="avatar"><UserRound size={34} /></div>
        <div>
          <p className="muted">Member since {state.user.memberSince}</p>
          <Input value={state.user.name} onChange={(e) => setState((current) => ({ ...current, user: { ...current.user, name: e.target.value } }))} title="Edit the display name used in greetings." />
        </div>
      </Card>
      <div className="stats-grid">
        <StatCard label="Protocols" value={state.protocols.length} icon={<BadgeCheck size={18} />} />
        <StatCard label="Peptides" value={state.peptides.length} icon={<BadgeCheck size={18} />} />
        <StatCard label="Logged days" value={stats.currentStreak} icon={<BadgeCheck size={18} />} />
        <StatCard label="Doses" value={stats.totalDoses} icon={<BadgeCheck size={18} />} />
      </div>

      <Card>
        <p className="eyebrow">Achievements</p>
        <div className="badge-grid">
          {achievementLabels.map((label) => (
            <AchievementBadge
              key={label}
              label={label}
              unlocked={label === "30-Day Streak" ? stats.bestStreak >= 30 : true}
            />
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Goals</p>
        <div className="chip-row roomy">
          {goals.map((goal) => (
            <button key={goal} onClick={() => toggleGoal(goal)} className="chip-button" title={`Toggle the ${goal} goal.`}>
              <GoalChip goal={goal} active={state.user.goals.includes(goal)} />
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Customize dashboard</p>
        <div className="stack tight">
          {state.dashboardWidgets.map((widget) => (
            <div className="metric-config" key={widget.id}>
              <label title="Show or hide this widget on the Home dashboard."><input type="checkbox" checked={widget.visible} onChange={(e) => setState((current) => ({ ...current, dashboardWidgets: current.dashboardWidgets.map((item) => item.id === widget.id ? { ...item, visible: e.target.checked } : item) }))} /> {widget.title}</label>
              <Select value={widget.size} onChange={(e) => setState((current) => ({ ...current, dashboardWidgets: current.dashboardWidgets.map((item) => item.id === widget.id ? { ...item, size: e.target.value as typeof widget.size } : item) }))} title="Choose how much space this widget should use.">
                <option>small</option>
                <option>medium</option>
                <option>large</option>
              </Select>
              <label title="Pin this widget as a favorite."><input type="checkbox" checked={widget.pinned} onChange={(e) => setState((current) => ({ ...current, dashboardWidgets: current.dashboardWidgets.map((item) => item.id === widget.id ? { ...item, pinned: e.target.checked } : item) }))} /> Pin</label>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Body metrics</p>
        <div className="two-col">
          <Input placeholder="Weight" value={metric.weight || ""} onChange={(e) => updateMetric({ weight: e.target.value })} title="Quick update for your latest weight note." />
          <Input type="number" min="1" max="10" placeholder="Sleep quality" value={metric.sleepQuality || ""} onChange={(e) => updateMetric({ sleepQuality: Number(e.target.value) })} title="Rate sleep quality from 1 to 10." />
        </div>
        <div className="two-col">
          <Input type="number" min="1" max="10" placeholder="Energy" value={metric.energy || ""} onChange={(e) => updateMetric({ energy: Number(e.target.value) })} title="Rate energy from 1 to 10." />
          <Input type="number" min="1" max="10" placeholder="Pain level" value={metric.painLevel || ""} onChange={(e) => updateMetric({ painLevel: Number(e.target.value) })} title="Rate pain from 1 to 10." />
        </div>
        <Textarea placeholder="Notes" value={metric.notes || ""} onChange={(e) => updateMetric({ notes: e.target.value })} title="Private body metric notes." />
      </Card>

      <Card>
        <p className="eyebrow">Reminders</p>
        <h2>PWA notification placeholder</h2>
        <p className="subtle">Browser notifications can be requested in compatible PWAs. For reliable iPhone reminders, the native Expo version should add iOS notification permissions, background scheduling, and per-dose notification IDs here.</p>
        <Button
          className="mt-12"
          title="Ask the browser for notification permission when supported."
          onClick={() => {
            if ("Notification" in window) {
              Notification.requestPermission();
            }
            // Native iOS/Expo notification scheduling will replace this browser placeholder later.
          }}
        >
          Request browser notifications
        </Button>
      </Card>
    </div>
  );
}
