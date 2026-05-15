import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Activity, Camera, Droplets, HeartPulse, ListPlus, Moon, NotebookPen, Plus, Scale, Smile, Syringe, Zap } from "lucide-react";
import { AppState, DoseLog, DoseMethod, DoseStatus, DoseUnit, MetricConfig, MetricEntry, ScheduledDose } from "../types";
import { getLogForDose, getPeptide, toDateKey, vialMathForItem } from "../lib/calculations";
import { Button, Card, Input, ScreenHeader, Select, Textarea } from "../components/ui";

const metricIcons = [Scale, Moon, Smile, Zap, Activity, Droplets, Syringe, HeartPulse, Camera, NotebookPen];
const units: DoseUnit[] = ["mcg", "mg", "IU", "units", "mL", "capsule", "tablet"];
const methods: DoseMethod[] = ["SubQ", "IM", "IV", "Oral", "Nasal", "Other"];

export function TrackScreen({
  state,
  setState,
  scheduledDoses,
  logDose,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  scheduledDoses: ScheduledDose[];
  logDose: (dose: ScheduledDose, status: DoseStatus) => void;
}) {
  const todayKey = toDateKey(new Date());
  const dueToday = scheduledDoses.filter((dose) => dose.scheduledAt.startsWith(todayKey));
  const [selectedMetric, setSelectedMetric] = useState<MetricConfig | null>(null);
  const [showDoseLogger, setShowDoseLogger] = useState(false);
  const sortedMetrics = useMemo(() => [...state.metricConfigs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [state.metricConfigs]);

  return (
    <div className="screen">
      <ScreenHeader eyebrow="Quick logging" title="Track" action={<Button onClick={() => setShowDoseLogger(true)}><ListPlus size={16} /> Log New Entry</Button>} />

      <Card className="quick-dose-card">
        <p className="eyebrow">Dose logging</p>
        <h2>Log Dose</h2>
        <p className="subtle">Use scheduled doses below or log a custom user-entered dose.</p>
        <div className="stack tight mt-12">
          {dueToday.slice(0, 3).map((dose) => {
            const peptide = getPeptide(state.peptides, dose.peptideId);
            const logged = getLogForDose(state.doseLogs, dose.id);
            return (
              <div className="quick-dose-row" key={dose.id}>
                <span><strong>{peptide?.name || "Protocol item"}</strong><small>{dose.doseAmount} {dose.doseUnit} - {new Date(dose.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></span>
                {logged?.status === "taken" ? <b>Logged</b> : <Button onClick={() => logDose(dose, "taken")}>Take now</Button>}
              </div>
            );
          })}
          {!dueToday.length && <p className="subtle">No scheduled doses today. Use Log New Entry for custom logs.</p>}
        </div>
      </Card>

      {showDoseLogger && <LogDoseForm state={state} setState={setState} onClose={() => setShowDoseLogger(false)} />}

      <div className="section-title">
        <h2>Metric Library</h2>
        <Button variant="ghost" onClick={() => addCustomMetric(setState)}><Plus size={15} /> Add Custom Metric</Button>
      </div>
      <div className="metric-library">
        {sortedMetrics.map((metric, index) => {
          const Icon = metricIcons[index % metricIcons.length];
          const latest = state.metricEntries.find((entry) => entry.metricId === metric.id);
          return (
            <button key={metric.id} className={`metric-module ${metric.enabled ? "enabled" : ""}`} onClick={() => setSelectedMetric(metric)}>
              <Icon size={18} />
              <span><strong>{metric.name}</strong><small>{latest ? `${latest.value}${metric.unit ? ` ${metric.unit}` : ""}` : "No entries"}</small></span>
              <b>{metric.favorite ? "Pinned" : metric.enabled ? "On" : "Off"}</b>
            </button>
          );
        })}
      </div>

      {selectedMetric && <MetricDetail metric={selectedMetric} state={state} setState={setState} onClose={() => setSelectedMetric(null)} />}
    </div>
  );
}

function addCustomMetric(setState: Dispatch<SetStateAction<AppState>>) {
  const name = window.prompt("Custom metric name");
  if (!name?.trim()) return;
  setState((current) => ({
    ...current,
    metricConfigs: [
      ...current.metricConfigs,
      {
        id: `metric-custom-${crypto.randomUUID()}`,
        name,
        category: "Custom",
        inputType: "numeric",
        frequency: "As needed",
        goalDirection: "Informational only",
        enabled: true,
        showOnDashboard: true,
        showInAnalytics: true,
        quickEntry: false,
        favorite: false,
        order: current.metricConfigs.length,
      },
    ],
  }));
}

function MetricDetail({ metric, state, setState, onClose }: { metric: MetricConfig; state: AppState; setState: Dispatch<SetStateAction<AppState>>; onClose: () => void }) {
  const [value, setValue] = useState("");
  const entries = state.metricEntries.filter((entry) => entry.metricId === metric.id).slice(0, 8);
  const updateMetric = (patch: Partial<MetricConfig>) => setState((current) => ({
    ...current,
    metricConfigs: current.metricConfigs.map((item) => item.id === metric.id ? { ...item, ...patch } : item),
  }));
  return (
    <Card className="editor-panel">
      <div className="section-title"><h2>{metric.name}</h2><button className="text-button" onClick={onClose}>Close</button></div>
      <div className="metric-detail-actions">
        <label><input type="checkbox" checked={metric.enabled} onChange={(e) => updateMetric({ enabled: e.target.checked })} /> Enabled</label>
        <label><input type="checkbox" checked={!!metric.favorite} onChange={(e) => updateMetric({ favorite: e.target.checked, quickEntry: e.target.checked })} /> Favorite</label>
        <label><input type="checkbox" checked={metric.showInAnalytics} onChange={(e) => updateMetric({ showInAnalytics: e.target.checked })} /> Insights</label>
      </div>
      <div className="metric-log-row">
        <div><strong>Quick log</strong><span>{metric.inputType}</span></div>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={metric.unit || "Value"} />
        <Button onClick={() => {
          if (!value) return;
          const entry: MetricEntry = { id: `metric-entry-${crypto.randomUUID()}`, metricId: metric.id, date: new Date().toISOString(), value };
          setState((current) => ({ ...current, metricEntries: [entry, ...current.metricEntries] }));
          setValue("");
        }}>Log</Button>
      </div>
      <div className="history-list">
        {entries.map((entry) => <span key={entry.id}>{new Date(entry.date).toLocaleDateString()}<strong>{entry.value}</strong></span>)}
        {!entries.length && <p className="subtle">No entries yet.</p>}
      </div>
    </Card>
  );
}

function LogDoseForm({ state, setState, onClose }: { state: AppState; setState: Dispatch<SetStateAction<AppState>>; onClose: () => void }) {
  const [peptideId, setPeptideId] = useState(state.peptides[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<DoseUnit>("mg");
  const [method, setMethod] = useState<DoseMethod>("SubQ");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");
  const itemWithVial = state.protocols.flatMap((protocol) => protocol.items).find((item) => item.peptideId === peptideId && item.vialTracking?.enabled);
  const vial = itemWithVial ? vialMathForItem(itemWithVial) : null;

  const submit = () => {
    const loggedAt = `${date}T${time}:00`;
    const log: DoseLog = {
      id: `manual-log-${crypto.randomUUID()}`,
      scheduledDoseId: `manual-${crypto.randomUUID()}`,
      status: "taken",
      loggedAt,
      takenAt: loggedAt,
      takenLate: false,
      notes,
      peptideId,
      amount,
      unit,
      method,
      injectionSite: site,
    };
    setState((current) => ({
      ...current,
      doseLogs: [log, ...current.doseLogs],
      injectionSites: (current.injectionSites || []).map((entry) => entry.name === site ? { ...entry, lastUsedAt: loggedAt } : entry),
    }));
    onClose();
  };

  return (
    <Card className="log-dose-form">
      <div className="section-title"><h2>Log Dose</h2><button className="text-button" onClick={onClose}>Close</button></div>
      <Select value={peptideId} onChange={(e) => setPeptideId(e.target.value)}>{state.peptides.map((peptide) => <option key={peptide.id} value={peptide.id}>{peptide.name}</option>)}</Select>
      {vial && <p className="subtle">Vial: {vial.remaining} remaining - {vial.dosesRemaining} estimated doses left</p>}
      <div className="protocol-dose-grid">
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
        <Select value={unit} onChange={(e) => setUnit(e.target.value as DoseUnit)}>{units.map((value) => <option key={value}>{value}</option>)}</Select>
      </div>
      <div className="protocol-dose-grid">
        <label className="field-label">
          <span>Date <button type="button" className="inline-link" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>Today</button></span>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field-label">
          <span>Time <button type="button" className="inline-link" onClick={() => setTime(new Date().toTimeString().slice(0, 5))}>Now</button></span>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <div className="protocol-dose-grid">
        <Select value={method} onChange={(e) => setMethod(e.target.value as DoseMethod)}>{methods.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={site} onChange={(e) => setSite(e.target.value)}><option value="">Injection site</option>{(state.injectionSites || []).map((entry) => <option key={entry.id}>{entry.name}</option>)}</Select>
      </div>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes optional" />
      <Button onClick={submit}>Log Dose</Button>
    </Card>
  );
}
