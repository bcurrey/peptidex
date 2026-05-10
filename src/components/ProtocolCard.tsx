import { CalendarDays, Pause, Play } from "lucide-react";
import { daysBetween } from "../lib/calculations";
import { Peptide, Protocol } from "../types";
import { Card } from "./ui";

export function ProtocolCard({
  protocol,
  peptides,
  adherence,
  onClick,
}: {
  protocol: Protocol;
  peptides: Peptide[];
  adherence: number;
  onClick: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = daysBetween(today, protocol.cycleEndDate);
  const currentWeek = Math.max(1, Math.ceil(daysBetween(protocol.cycleStartDate, today) / 7));
  return (
    <Card className="protocol-card clickable" onClick={onClick}>
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
      <p className="subtle with-icon"><CalendarDays size={14} /> {protocol.cycleStartDate} to {protocol.cycleEndDate}</p>
    </Card>
  );
}
