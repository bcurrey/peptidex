import { Peptide } from "../types";
import { Card } from "./ui";

export function PeptideCard({ peptide, onClick }: { peptide: Peptide; onClick: () => void }) {
  const tags = peptide.categoryTags?.filter((tag) => tag.toLowerCase() !== "experimental").slice(0, 2);

  return (
    <Card className="list-card peptide-row clickable" onClick={onClick}>
      <div>
        <h3>{peptide.name}</h3>
        <span className="subtle">{tags?.length ? tags.join(" / ") : peptide.category}</span>
      </div>
      <span className="mini-chip">{peptide.category}</span>
    </Card>
  );
}
