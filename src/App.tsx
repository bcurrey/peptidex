import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { NextDoseBar } from "./components/NextDoseBar";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { PeptidesScreen } from "./screens/PeptidesScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ProtocolsScreen } from "./screens/ProtocolsScreen";
import { getPeptide, generateScheduledDoses } from "./lib/calculations";
import { loadState, resetState, saveState } from "./lib/storage";
import { AppState, DoseLog, DoseStatus, ScheduledDose } from "./types";
import { AppHeader, SafetyNotice } from "./components/ui";

export type Tab = "home" | "peptides" | "protocols" | "analytics" | "profile";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => saveState(state), [state]);

  const scheduledDoses = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return generateScheduledDoses(state.protocols, state.peptides, start, end);
  }, [state.peptides, state.protocols]);

  const nextDose = scheduledDoses.find((dose) => new Date(dose.scheduledAt).getTime() >= Date.now());
  const nextPeptide = nextDose ? getPeptide(state.peptides, nextDose.peptideId) : undefined;

  const logDose = (dose: ScheduledDose, status: DoseStatus, notes = "") => {
    setState((current) => {
      const existing = current.doseLogs.find((log) => log.scheduledDoseId === dose.id);
      const log: DoseLog = {
        id: existing?.id || `log-${crypto.randomUUID()}`,
        scheduledDoseId: dose.id,
        status,
        loggedAt: new Date().toISOString(),
        takenAt: status === "taken" ? new Date().toISOString() : existing?.takenAt,
        takenLate: status === "taken" && new Date(dose.scheduledAt).getTime() + 30 * 60 * 1000 < Date.now(),
        notes,
      };
      return {
        ...current,
        doseLogs: [...current.doseLogs.filter((item) => item.scheduledDoseId !== dose.id), log],
      };
    });
  };

  const updateLog = (log: DoseLog) => {
    setState((current) => ({
      ...current,
      doseLogs: current.doseLogs.map((item) => item.id === log.id ? log : item),
    }));
  };

  const deleteScheduleItem = (dose: ScheduledDose) => {
    setState((current) => ({
      ...current,
      protocols: current.protocols.map((protocol) => protocol.id === dose.protocolId
        ? { ...protocol, items: protocol.items.filter((item) => item.id !== dose.protocolItemId) }
        : protocol),
      doseLogs: current.doseLogs.filter((log) => log.scheduledDoseId !== dose.id),
    }));
  };

  const viewNextDose = () => {
    setActiveTab("home");
    window.setTimeout(() => document.getElementById("todays-doses")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const screenProps = { state, setState, scheduledDoses, logDose, updateLog, deleteScheduleItem };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <AppHeader
        subtitle="Protocol tracker"
        action={
        <button className="icon-button" aria-label="Reset sample data" title="Reset local demo data and seed examples." onClick={() => setState(resetState())}>
          <RotateCcw size={18} />
        </button>
        }
      />

      <SafetyNotice />

      <main>
        {activeTab === "home" && <HomeScreen {...screenProps} />}
        {activeTab === "peptides" && <PeptidesScreen state={state} setState={setState} />}
        {activeTab === "protocols" && <ProtocolsScreen state={state} setState={setState} />}
        {activeTab === "analytics" && <AnalyticsScreen state={state} setState={setState} scheduledDoses={scheduledDoses} />}
        {activeTab === "profile" && <ProfileScreen state={state} setState={setState} />}
      </main>

      <div className="floating-actions">
        <button aria-label="Quick add" title="Jump to Protocols to create or edit a protocol." className="fab" onClick={() => setActiveTab("protocols")}>
          <Plus size={22} />
        </button>
      </div>

      <NextDoseBar dose={nextDose} peptide={nextPeptide} onView={viewNextDose} />
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
