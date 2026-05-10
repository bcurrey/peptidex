import { Activity, BarChart3, Home, User, Workflow } from "lucide-react";
import { Tab } from "../App";

const items = [
  { id: "home", label: "Home", icon: Home, tip: "Dashboard with today's plan, streaks, and next dose." },
  { id: "peptides", label: "Peptides", icon: Activity, tip: "Browse, search, and edit peptide tracking profiles." },
  { id: "protocols", label: "Protocols", icon: Workflow, tip: "Create and manage protocol schedules and templates." },
  { id: "analytics", label: "Analytics", icon: BarChart3, tip: "View metrics, charts, insights, inventory, labs, and exports." },
  { id: "profile", label: "Profile", icon: User, tip: "Edit profile, goals, reminders, privacy, and dashboard widgets." },
] as const;

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => onChange(item.id)} title={item.tip} aria-label={`${item.label}: ${item.tip}`}>
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
