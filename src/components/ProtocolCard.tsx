import { CalendarDays, Pause, Play } from "lucide-react";
import { daysBetween } from "../lib/calculations";
import { Peptide, Protocol } from "../types";
import { useLongPress } from "../hooks/useLongPress";
import { Card } from "./ui";

export function ProtocolCard({
  protocol,
  peptides,
  adherence,
  onClick,
  onDelete,
}: {
  protocol: Protocol;
  peptides: Peptide[];
  adherence: number;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = protocol.noEndDate ? null : daysBetween(today, protocol.cycleEndDate);
  const currentWeek = Math.max(1, Math.ceil(daysBetween(protocol.cycleStartDate, today) / 7));
  const totalWeeks = protocol.noEndDate ? null : Math.max(1, Math.ceil(daysBetween(protocol.cycleStartDate, protocol.cycleEndDate) / 7));
  const startLabel = new Date(`${protocol.cycleStartDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });
  const endLabel = protocol.noEndDate ? "No end date" : new Date(`${protocol.cycleEndDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });
  const dateRange = `${startLabel} -> ${endLabel}`;
  const longPress = useLongPress(() => {
    if (onDelete && window.confirm(`Delete "${protocol.name}"? This removes the saved protocol and its generated dose logs.`)) onDelete();
  });

  return (
    <Card className="protocol-card compact-protocol clickable long-pressable" onClick={onClick} {...longPress}>
      <div className="row-between">
        <div>
          <h3>{protocol.name}</h3>
          <p className="muted">{protocol.noEndDate ? `Week ${currentWeek} - Ongoing` : `Week ${currentWeek} of ${totalWeeks} - ${daysLeft} days left`}</p>
        </div>
        <button className="btn ghost action-text" type="button">
          {protocol.paused ? <Pause size={15} /> : <Play size={15} />}
          Resume
        </button>
      </div>
      <div className="mini-progress">
        <span style={{ width: `${adherence}%` }} />
      </div>
      <div className="protocol-meta">
        <span>{adherence}% adherence</span>
      </div>
      <div className="chip-row">
        {protocol.items.map((item) => {
          const peptide = peptides.find((p) => p.id === item.peptideId);
          return <span key={item.id} className="mini-chip">{peptide?.nickname || peptide?.name}</span>;
        })}
      </div>
      <p className="subtle with-icon"><CalendarDays size={14} /> {dateRange}</p>
    </Card>
  );
}
