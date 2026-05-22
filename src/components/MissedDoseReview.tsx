import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Clock, SkipForward } from "lucide-react";
import { getPeptide, toDateKey } from "../lib/calculations";
import { localDateInputValue, localTimeInputValue } from "../lib/dates";
import { AppState, DoseLog, DoseMethod, DoseUnit, ScheduledDose } from "../types";
import { Button, Card, Input, Select, Textarea } from "./ui";

const units: DoseUnit[] = ["mcg", "mg", "IU", "units", "mL", "capsule", "tablet"];
const methods: DoseMethod[] = ["SubQ", "IM", "IV", "Oral", "Nasal", "Other"];

export function missedDosesForReview(state: AppState, scheduledDoses: ScheduledDose[], daysBack = 7) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);
  return scheduledDoses
    .filter((dose) => {
      const scheduledAt = new Date(dose.scheduledAt);
      if (scheduledAt >= now || scheduledAt < start) return false;
      const existing = state.doseLogs.find((log) => log.scheduledDoseId === dose.id);
      return !existing;
    })
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}

export function MissedDoseReview({
  state,
  setState,
  scheduledDoses,
  limit = 5,
  showViewAll = true,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  scheduledDoses: ScheduledDose[];
  limit?: number;
  showViewAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<ScheduledDose | null>(null);
  const missed = useMemo(() => missedDosesForReview(state, scheduledDoses), [state, scheduledDoses]);
  const visible = expanded ? missed : missed.slice(0, limit);
  if (!missed.length) return null;

  return (
    <section className="missed-review-section">
      <div className="section-title">
        <div>
          <h2>Missed / Needs Review</h2>
          <span>{missed.length} recent item{missed.length === 1 ? "" : "s"}</span>
        </div>
        {showViewAll && missed.length > limit && (
          <button className="text-button" onClick={() => setExpanded((current) => !current)}>
            {expanded ? "Show Less" : "View All"}
          </button>
        )}
      </div>
      <div className="stack tight">
        {visible.map((dose) => (
          <MissedDoseCard key={dose.id} dose={dose} state={state} setState={setState} onLog={() => setSelected(dose)} />
        ))}
      </div>
      {selected && <CatchUpLogForm state={state} setState={setState} dose={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function MissedDoseCard({
  dose,
  state,
  setState,
  onLog,
}: {
  dose: ScheduledDose;
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  onLog: () => void;
}) {
  const peptide = getPeptide(state.peptides, dose.peptideId);
  const protocol = state.protocols.find((item) => item.id === dose.protocolId);
  const scheduledAt = new Date(dose.scheduledAt);
  return (
    <Card className="missed-dose-card">
      <div className="dose-main">
        <div>
          <p className="muted">{scheduledAt.toLocaleDateString([], { month: "short", day: "numeric" })} - {scheduledAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
          <h3>{peptide?.name || "Protocol item"}</h3>
          <span className="subtle">{protocol?.name || "Scheduled dose"} - {dose.doseAmount} {dose.doseUnit}</span>
        </div>
        <span className="status-pill missed">Missed</span>
      </div>
      <div className="dose-actions">
        <Button onClick={onLog} title="Open catch-up logging for this missed scheduled dose."><Clock size={16} /> Log Now</Button>
        <Button variant="ghost" onClick={() => skipDose(state, setState, dose)} title="Mark this missed scheduled dose as skipped."><SkipForward size={16} /> Skip</Button>
      </div>
    </Card>
  );
}

function CatchUpLogForm({
  state,
  setState,
  dose,
  onClose,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  dose: ScheduledDose;
  onClose: () => void;
}) {
  const scheduledAt = new Date(dose.scheduledAt);
  const [date, setDate] = useState(toDateKey(scheduledAt));
  const [time, setTime] = useState(scheduledAt.toTimeString().slice(0, 5));
  const [amount, setAmount] = useState(dose.doseAmount);
  const [unit, setUnit] = useState<DoseUnit>(dose.doseUnit);
  const [method, setMethod] = useState<DoseMethod>(dose.method || "SubQ");
  const [site, setSite] = useState("");
  const [notes, setNotes] = useState("");
  const peptide = getPeptide(state.peptides, dose.peptideId);

  const submit = () => {
    const loggedAt = `${date}T${time}:00`;
    const log: DoseLog = {
      id: `log-${crypto.randomUUID()}`,
      scheduledDoseId: dose.id,
      status: "taken",
      loggedAt,
      takenAt: loggedAt,
      takenLate: new Date(loggedAt).getTime() > new Date(dose.scheduledAt).getTime() + 30 * 60 * 1000,
      notes,
      peptideId: dose.peptideId,
      amount,
      unit,
      method,
      injectionSite: site,
    };
    setState((current) => ({
      ...current,
      doseLogs: [log, ...current.doseLogs.filter((item) => item.scheduledDoseId !== dose.id)],
      injectionSites: (current.injectionSites || []).map((entry) => entry.name === site ? { ...entry, lastUsedAt: loggedAt } : entry),
    }));
    onClose();
  };

  return (
    <Card className="log-dose-form catch-up-form">
      <div className="section-title">
        <div>
          <p className="eyebrow">Catch-up log</p>
          <h2>{peptide?.name || "Log Dose"}</h2>
        </div>
        <button className="text-button" onClick={onClose}>Close</button>
      </div>
      <p className="subtle">Defaults to the original scheduled date and time. Adjust it if the actual taken time was different.</p>
      <div className="protocol-dose-grid">
        <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
        <Select value={unit} onChange={(event) => setUnit(event.target.value as DoseUnit)}>{units.map((value) => <option key={value}>{value}</option>)}</Select>
      </div>
      <div className="protocol-dose-grid">
        <label className="field-label">
          <span>Date <button type="button" className="inline-link" onClick={() => setDate(localDateInputValue())}>Today</button></span>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="field-label">
          <span>Time <button type="button" className="inline-link" onClick={() => setTime(localTimeInputValue())}>Now</button></span>
          <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
      </div>
      <div className="protocol-dose-grid">
        <Select value={method} onChange={(event) => setMethod(event.target.value as DoseMethod)}>{methods.map((value) => <option key={value}>{value}</option>)}</Select>
        <Select value={site} onChange={(event) => setSite(event.target.value)}><option value="">Injection site</option>{(state.injectionSites || []).map((entry) => <option key={entry.id}>{entry.name}</option>)}</Select>
      </div>
      <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes optional" />
      <Button onClick={submit}>Save Log</Button>
    </Card>
  );
}

function skipDose(state: AppState, setState: Dispatch<SetStateAction<AppState>>, dose: ScheduledDose) {
  const log: DoseLog = {
    id: `log-${crypto.randomUUID()}`,
    scheduledDoseId: dose.id,
    status: "skipped",
    loggedAt: dose.scheduledAt,
    takenLate: false,
    notes: "Dismissed from Needs Review.",
    peptideId: dose.peptideId,
    amount: dose.doseAmount,
    unit: dose.doseUnit,
    method: dose.method,
  };
  setState((current) => ({
    ...current,
    doseLogs: [log, ...current.doseLogs.filter((item) => item.scheduledDoseId !== dose.id)],
  }));
}
