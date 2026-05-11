import { CalendarDays, Pause, Play } from "lucide-react";
import { daysBetween } from "../lib/calculations";
import { Peptide, Protocol } from "../types";
import { Card } from "./ui";
import { useLongPress } from "../hooks/useLongPress";

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
  const daysLeft = daysBetween(today, protocol.cycleEndDate);
  const currentWeek = Math.max(1, Math.ceil(daysBetween(protocol.cycleStartDate, today) / 7));
  const longPress = useLongPress(() => {
    if (onDelete && window.confirm(`Delete "${protocol.name}"? This removes the saved protocol and its generated dose logs.`)) onDelete();
  });

  return (
    <Card className="protocol-card compact-protocol clickable long-pressable" onClick={onClick} {...longPress}>
      <div className="row-between">
        <div>
          <p className="muted">{protocol.items.length} protocol items</p>
          <h3>{protocol.name}</h3>
        </div>
        <span className={`round-state ${protocol.paused ? "paused" : "active"}`}>
          {protocol.paused ? <Pause size={15} /> : <Play size={15} />}
        </span>
      </div>
      <div className="mini-progress">
        <span style={{ width: `${adherence}%` }} />
      </div>
      <div className="protocol-meta">
        <span>{adherence}% adherence</span>
        <span>Week {currentWeek}</span>
        <span>{daysLeft} days left</span>
      </div>
      <div className="chip-row">
        {protocol.items.map((item) => {
          const peptide = peptides.find((p) => p.id === item.peptideId);
          return <span key={item.id} className="mini-chip">{peptide?.nickname || peptide?.name}</span>;
        })}
      </div>
      <button className="inline-action" type="button">View / Continue</button>
      <span className="press-hint">Hold to delete</span>
      <p className="subtle with-icon"><CalendarDays size={14} /> {protocol.cycleStartDate} to {protocol.cycleEndDate}</p>
    </Card>
  );
}
