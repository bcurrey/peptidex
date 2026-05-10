import { Check, Clock3, SkipForward, X } from "lucide-react";
import { statusForDose } from "../lib/calculations";
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
  const localTakenAt = log?.takenAt ? log.takenAt.slice(0, 16) : "";
  return (
    <Card className={`dose-card ${status || ""}`}>
      <div className="dose-main">
        <div>
          <p className="muted">{time} - {dose.instructions || "Scheduled"}</p>
          <h3>{peptide?.name || "Protocol item"}</h3>
          <span className="subtle">
            {dose.doseAmount} {dose.doseUnit} - user-entered note
          </span>
        </div>
        <span className={`status-pill ${status || "pending"}`}>{status || "pending"}</span>
      </div>
      <div className="dose-actions">
        {!isTaken && <Button onClick={() => onStatus(dose, "taken")} title="Mark this scheduled item as taken."><Check size={16} /> Taken</Button>}
        {!isTaken && !isMissed && <Button variant="ghost" onClick={() => onStatus(dose, "snoozed")} title="Snooze this item for later."><Clock3 size={16} /></Button>}
        {!isTaken && <Button variant="ghost" onClick={() => onStatus(dose, "skipped")} title="Mark this item as intentionally skipped."><SkipForward size={16} /></Button>}
        {!isMissed && !isTaken && <Button variant="ghost" onClick={() => onStatus(dose, "missed")} title="Mark this scheduled item as missed."><X size={16} /></Button>}
        {isTaken && <Button variant="ghost" className="action-text" onClick={() => onStatus(dose, "snoozed")} title="Change this log if needed."><Clock3 size={16} /> Edit</Button>}
        {onDeleteScheduleItem && <Button variant="ghost" className="action-text" onClick={() => onDeleteScheduleItem(dose)} title="Remove this item from its protocol schedule.">Remove</Button>}
      </div>
      {log && onUpdateLog && (
        <div className="log-editor">
          <Input
            type="datetime-local"
            value={localTakenAt}
            onChange={(event) => onUpdateLog({ ...log, takenAt: new Date(event.target.value).toISOString(), loggedAt: new Date(event.target.value).toISOString() })}
            aria-label="Edit timestamp"
            title="Edit the timestamp for this log."
          />
          <Input
            value={log.notes}
            onChange={(event) => onUpdateLog({ ...log, notes: event.target.value })}
            placeholder="Dose notes"
            aria-label="Dose notes"
            title="Add a private note for this logged item."
          />
          {log.takenLate && <p className="late-note">Taken late</p>}
        </div>
      )}
    </Card>
  );
}
