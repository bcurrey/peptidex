import { Check, SkipForward } from "lucide-react";
import { statusForDose } from "../lib/calculations";
import { dateTimeForInput, localDateTime } from "../lib/dates";
import { DoseLog, DoseStatus, Peptide, ScheduledDose } from "../types";
import { Button, Card, Input } from "./ui";

export function DoseCard({
  dose,
  peptide,
  log,
  onStatus,
  onUpdateLog,
  onDeleteScheduleItem,
}: {
  dose: ScheduledDose;
  peptide?: Peptide;
  log?: DoseLog;
  onStatus: (dose: ScheduledDose, status: DoseStatus) => void;
  onUpdateLog?: (log: DoseLog) => void;
  onDeleteScheduleItem?: (dose: ScheduledDose) => void;
}) {
  const time = new Date(dose.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const computedStatus = statusForDose(dose, []);
  const status = log?.status || (computedStatus === "snoozed" ? "upcoming" : computedStatus);
  const isTaken = status === "taken";
  const isMissed = status === "missed";
  const localTakenAt = log?.takenAt ? dateTimeForInput(log.takenAt) : "";
  return (
    <Card className={`dose-card ${status || ""}`}>
      <div className="dose-main">
        <div>
          <p className="muted">{time} · {dose.instructions || "Scheduled"}</p>
          <h3>{peptide?.name || "Protocol item"}</h3>
          <span className="subtle">
            {dose.doseAmount} {dose.doseUnit}
          </span>
        </div>
        <span className={`status-pill ${status || "pending"}`}>{status || "pending"}</span>
      </div>
      <div className="dose-actions">
        {isTaken ? (
          <span className="logged-text"><Check size={16} /> Logged</span>
        ) : (
          <>
            <Button onClick={() => onStatus(dose, "taken")} title="Record this dose as taken right now."><Check size={16} /> {isMissed ? "Log now" : "Take now"}</Button>
            <Button variant="ghost" className="action-text" onClick={() => onStatus(dose, "skipped")} title="Mark this item as intentionally skipped."><SkipForward size={16} /> Skip</Button>
          </>
        )}
      </div>
      {log && onUpdateLog && (
        <div className="log-editor">
          <Input
            type="datetime-local"
            value={localTakenAt}
            onChange={(event) => {
              if (!event.target.value) return;
              const nextTime = localDateTime(new Date(event.target.value));
              onUpdateLog({ ...log, takenAt: nextTime, loggedAt: nextTime });
            }}
            aria-label="Edit timestamp"
            title="Edit the timestamp for this log."
          />
          {log.takenLate && <p className="late-note">Taken late</p>}
        </div>
      )}
    </Card>
  );
}
