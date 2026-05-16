import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { NextDoseBar } from "./components/NextDoseBar";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MoreScreen } from "./screens/MoreScreen";
import { ProtocolsScreen } from "./screens/ProtocolsScreen";
import { TrackScreen } from "./screens/TrackScreen";
import { getPeptide, generateScheduledDoses } from "./lib/calculations";
import { localDateTime } from "./lib/dates";
import { loadState, resetState, saveState } from "./lib/storage";
import { AppState, DoseLog, DoseStatus, ScheduledDose } from "./types";
import { Button } from "./components/ui";

export type Tab = "dashboard" | "protocols" | "track" | "insights" | "more";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => saveState(state), [state]);

  const scheduledDoses = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const end = new Date();
    end.setDate(end.getDate() + 14);
    return generateScheduledDoses(state.protocols, state.peptides, start, end);
  }, [state.peptides, state.protocols]);

  const nextDose = scheduledDoses.find((dose) =>
    new Date(dose.scheduledAt).getTime() >= Date.now() &&
    !state.doseLogs.some((log) => log.scheduledDoseId === dose.id && (log.status === "taken" || log.status === "skipped"))
  );
  const nextPeptide = nextDose ? getPeptide(state.peptides, nextDose.peptideId) : undefined;

  const logDose = (dose: ScheduledDose, status: DoseStatus, notes = "") => {
    setState((current) => {
      const existing = current.doseLogs.find((log) => log.scheduledDoseId === dose.id);
      const now = new Date();
      const log: DoseLog = {
        id: existing?.id || `log-${crypto.randomUUID()}`,
        scheduledDoseId: dose.id,
        status,
        loggedAt: localDateTime(now),
        takenAt: status === "taken" ? localDateTime(now) : existing?.takenAt,
        takenLate: status === "taken" && new Date(dose.scheduledAt).getTime() + 30 * 60 * 1000 < now.getTime(),
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

  const deleteLog = (log: DoseLog) => {
    setState((current) => ({
      ...current,
      doseLogs: current.doseLogs.filter((item) => item.id !== log.id),
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
    setActiveTab("dashboard");
    const scrollToToday = () => {
      const target = document.getElementById("todays-doses");
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 92;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };
    window.setTimeout(scrollToToday, activeTab === "dashboard" ? 0 : 140);
    window.setTimeout(scrollToToday, 320);
  };

  const screenProps = { state, setState, scheduledDoses, logDose, updateLog, deleteScheduleItem, deleteLog };

  return (
    <div className="app-shell">
      <Button variant="ghost" className="reset-data-button" aria-label="Reset sample data" title="Reset local demo data and seed examples." onClick={() => setState(resetState())}>
        <RotateCcw size={16} />
      </Button>

      <main>
        {activeTab === "dashboard" && <HomeScreen {...screenProps} />}
        {activeTab === "protocols" && <ProtocolsScreen state={state} setState={setState} />}
        {activeTab === "track" && <TrackScreen state={state} setState={setState} scheduledDoses={scheduledDoses} logDose={logDose} />}
        {activeTab === "insights" && <AnalyticsScreen state={state} setState={setState} scheduledDoses={scheduledDoses} />}
        {activeTab === "more" && <MoreScreen state={state} setState={setState} />}
      </main>

      <NextDoseBar dose={nextDose} peptide={nextPeptide} onView={viewNextDose} />
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
