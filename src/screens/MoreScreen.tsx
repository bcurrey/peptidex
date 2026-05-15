import { Dispatch, SetStateAction, useState } from "react";
import { Calculator, CalendarClock, ChevronRight, Database, Droplets, FileDown, FlaskConical, Images, Library, RotateCcw, SlidersHorizontal, Syringe, UserRound, Workflow } from "lucide-react";
import { PeptidesScreen } from "./PeptidesScreen";
import { ProfileScreen } from "./ProfileScreen";
import { AppState } from "../types";
import { Card, ScreenHeader } from "../components/ui";

type MoreView = "hub" | "peptides" | "profile" | "widgets" | string;

const groups = [
  {
    title: "Tools",
    items: [
      ["schedule", "Schedule", "Set dose reminders", CalendarClock],
      ["calculator", "Calculator", "Calculate user-entered amounts", Calculator],
      ["designer", "Protocol Designer", "Build schedules, cycles, and phases", Workflow],
    ],
  },
  {
    title: "Health & Tracking",
    items: [
      ["side-effects", "Side Effects", "Track user-entered symptoms/effects", Droplets],
      ["bloodwork", "Bloodwork", "Track lab result entries", FlaskConical],
      ["sites", "Injection Sites", "Track and rotate sites", Syringe],
      ["photos", "Progress Photos", "Compare progress photos", Images],
    ],
  },
  {
    title: "Data & Reports",
    items: [
      ["export", "Export Data", "Download logs and protocol history", FileDown],
      ["reports", "Reports", "Review trends and adherence", Database],
      ["backup", "Backup / Restore", "Manage saved app data", RotateCcw],
    ],
  },
  {
    title: "Settings",
    items: [
      ["peptides", "Peptide Library", "Manage peptides and blends", Library],
      ["widgets", "Dashboard Widgets", "Customize dashboard layout", SlidersHorizontal],
      ["profile", "Profile", "Account and preferences", UserRound],
    ],
  },
] as const;

export function MoreScreen({ state, setState }: { state: AppState; setState: Dispatch<SetStateAction<AppState>> }) {
  const [view, setView] = useState<MoreView>("hub");
  if (view === "peptides") return <PeptidesScreen state={state} setState={setState} onBack={() => setView("hub")} />;
  if (view === "profile" || view === "widgets") return <ProfileScreen state={state} setState={setState} onBack={() => setView("hub")} />;

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Tools" title="More" />
      {groups.map((group) => (
        <section className="more-group" key={group.title}>
          <p className="eyebrow">{group.title}</p>
          <Card className="more-list">
            {group.items.map(([id, title, subtitle, Icon]) => (
              <button
                key={id}
                className="more-row"
                onClick={() => {
                  if (id === "peptides") setView("peptides");
                  else if (id === "profile" || id === "widgets") setView(id);
                  else setView(id);
                }}
                title={subtitle}
              >
                <span className="more-icon"><Icon size={18} /></span>
                <span><strong>{title}</strong><small>{subtitle}</small></span>
                <ChevronRight size={17} />
              </button>
            ))}
          </Card>
        </section>
      ))}
      {view !== "hub" && (
        <Card>
          <button className="text-button" onClick={() => setView("hub")}>Back to More</button>
          <p className="subtle mt-12">This tool is organized here for now and can be expanded into a dedicated screen without changing your saved data.</p>
        </Card>
      )}
    </div>
  );
}
