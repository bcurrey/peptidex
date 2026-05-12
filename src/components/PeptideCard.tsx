import { Peptide } from "../types";

export function PeptideCard({ peptide, onClick }: { peptide: Peptide; onClick: () => void }) {
  const tags = peptide.categoryTags?.filter((tag) => tag.toLowerCase() !== "experimental").slice(0, 2);

  return (
    <button className="peptide-list-row clickable" onClick={onClick}>
      <div>
        <h3>{peptide.name}</h3>
        <span>Tap to view or edit details</span>
      </div>
      <span className="chip chip-category">{tags?.[0] || peptide.category}</span>
    </button>
  );
}
