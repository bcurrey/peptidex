import { BarChart3, Gauge, ListPlus, MoreHorizontal, Workflow } from "lucide-react";
import { Tab } from "../App";

const items = [
  { id: "dashboard", label: "Dashboard", icon: Gauge, tip: "Today overview, active protocols, and next dose." },
  { id: "protocols", label: "Protocols", icon: Workflow, tip: "Create and manage protocol schedules and templates." },
  { id: "track", label: "Track", icon: ListPlus, tip: "Log doses and metrics quickly." },
  { id: "insights", label: "Insights", icon: BarChart3, tip: "View metrics, charts, insights, inventory, labs, and exports." },
  { id: "more", label: "More", icon: MoreHorizontal, tip: "Tools, settings, peptide library, and reports." },
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
