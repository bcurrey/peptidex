import { Bell } from "lucide-react";
import { Peptide, ScheduledDose } from "../types";

export function NextDoseBar({ dose, peptide }: { dose?: ScheduledDose; peptide?: Peptide }) {
  if (!dose || !peptide) return null;
  const time = new Date(dose.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="next-dose">
      <Bell size={17} />
      <div>
        <span>Next dose</span>
        <strong>
          {peptide.nickname || peptide.name} at {time}
        </strong>
      </div>
      <button type="button" title="Open today's scheduled doses.">View</button>
    </div>
  );
}
