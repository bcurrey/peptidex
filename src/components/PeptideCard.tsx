import { Peptide } from "../types";
import { Card } from "./ui";

export function PeptideCard({ peptide, onClick }: { peptide: Peptide; onClick: () => void }) {
  return (
    <Card className="list-card peptide-row clickable" onClick={onClick}>
      <div>
        <p className="muted">{peptide.category}</p>
        <h3>{peptide.name}</h3>
        <span className="subtle">{peptide.nickname || peptide.description || "Custom item"}</span>
      </div>
      <strong>
        {peptide.defaultDose} {peptide.doseUnit}
      </strong>
    </Card>
  );
}
