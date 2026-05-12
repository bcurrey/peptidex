import { useMemo, useState } from "react";
import { getPeptide } from "../lib/calculations";
import { AppState, DoseLog, DoseStatus, ScheduledDose } from "../types";
import { Card, Input, Select, SectionHeader } from "./ui";
import { useLongPress } from "../hooks/useLongPress";

const pageSizes = [5, 10, 25];
const statuses: DoseStatus[] = ["taken", "skipped", "missed", "snoozed"];

export function DoseHistory({
  state,
  scheduledDoses,
  onUpdateLog,
  onDeleteLog,
}: {
  state: AppState;
  scheduledDoses: ScheduledDose[];
  onUpdateLog: (log: DoseLog) => void;
  onDeleteLog: (log: DoseLog) => void;
}) {
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(0);
  const doseById = useMemo(() => new Map(scheduledDoses.map((dose) => [dose.id, dose])), [scheduledDoses]);
  const logs = [...state.doseLogs].sort((a, b) => (b.takenAt || b.loggedAt).localeCompare(a.takenAt || a.loggedAt));
  const pageCount = Math.max(1, Math.ceil(logs.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = logs.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <section className="dose-history">
      <SectionHeader
        title="Dose History"
        meta={`${logs.length} logs`}
        action={
          <Select
            value={String(pageSize)}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(0);
            }}
            aria-label="Dose history page size"
            title="Choose how many logged doses to show per page."
          >
            {pageSizes.map((size) => <option key={size} value={size}>{size} at a time</option>)}
          </Select>
        }
      />

      {visible.map((log) => <DoseHistoryRow key={log.id} log={log} state={state} dose={doseById.get(log.scheduledDoseId)} onUpdateLog={onUpdateLog} onDeleteLog={onDeleteLog} />)}

      {logs.length > pageSize && (
        <div className="pager">
          <button disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button>
          <span>{safePage + 1} / {pageCount}</span>
          <button disabled={safePage >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next</button>
        </div>
      )}
    </section>
  );
}

function DoseHistoryRow({
  log,
  state,
  dose,
  onUpdateLog,
  onDeleteLog,
}: {
  log: DoseLog;
  state: AppState;
  dose?: ScheduledDose;
  onUpdateLog: (log: DoseLog) => void;
  onDeleteLog: (log: DoseLog) => void;
}) {
  const peptide = dose ? getPeptide(state.peptides, dose.peptideId) : undefined;
  const timestamp = log.takenAt || log.loggedAt;
  const longPress = useLongPress(() => {
    if (window.confirm("Delete this dose log?")) onDeleteLog(log);
  });

  return (
    <Card className="history-row long-pressable" {...longPress}>
      <div className="dose-main">
        <div>
          <p className="muted">{new Date(timestamp).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
          <h3>{peptide?.name || "Historical dose"}</h3>
          <span className="subtle">{dose ? `${dose.doseAmount} ${dose.doseUnit}` : "Imported or historical log"}</span>
        </div>
        <span className={`status-pill ${log.status}`}>{log.status}</span>
      </div>
      <div className="history-edit-grid">
        <Select
          value={log.status}
          onChange={(event) => onUpdateLog({ ...log, status: event.target.value as DoseStatus })}
          aria-label="Edit dose status"
          title="Edit the status for this dose log."
        >
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </Select>
        <Input
          type="datetime-local"
          value={timestamp.slice(0, 16)}
          onChange={(event) => {
            const nextTime = new Date(event.target.value).toISOString();
            onUpdateLog({ ...log, loggedAt: nextTime, takenAt: log.status === "taken" ? nextTime : log.takenAt });
          }}
          aria-label="Edit dose timestamp"
          title="Edit when this dose was logged."
        />
      </div>
      <Input
        value={log.notes}
        onChange={(event) => onUpdateLog({ ...log, notes: event.target.value })}
        placeholder="Notes"
        aria-label="Edit dose notes"
        title="Edit private notes for this logged dose."
      />
    </Card>
  );
}
