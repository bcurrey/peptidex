import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PeptideCard } from "../components/PeptideCard";
import { Button, Card, Input, ScreenHeader, Select, Textarea } from "../components/ui";
import { AppState, Category, DoseUnit, Peptide } from "../types";

const categories: ("All" | Category)[] = ["All", "Recovery", "Growth", "Cognitive", "Sleep", "Fat Loss", "Immune", "Custom"];
const units: DoseUnit[] = ["mcg", "mg", "IU", "units", "mL", "capsule", "tablet"];

const emptyPeptide: Peptide = {
  id: "",
  name: "",
  nickname: "",
  category: "Custom",
  description: "",
  doseUnit: "mg",
  defaultDose: "",
  notes: "",
  isCustom: true,
};

export function PeptidesScreen({ state, setState }: { state: AppState; setState: Dispatch<SetStateAction<AppState>> }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [editing, setEditing] = useState<Peptide | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const peptides = useMemo(() => {
    return state.peptides.filter((peptide) => {
      const matchesCategory = category === "All" || peptide.category === category;
      const matchesQuery = `${peptide.name} ${peptide.nickname}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.peptides, category, query]);

  useEffect(() => {
    if (editing) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing?.id]);

  const savePeptide = () => {
    if (!editing?.name.trim()) return;
    const saved = { ...editing, id: editing.id || `pep-${crypto.randomUUID()}` };
    setState((current) => ({
      ...current,
      peptides: [...current.peptides.filter((p) => p.id !== saved.id), saved],
    }));
    setEditing(null);
  };

  return (
    <div className="screen">
      <ScreenHeader
        eyebrow="Library"
        title="Peptides"
        action={<Button onClick={() => setEditing(emptyPeptide)} title="Add a custom peptide, pill, or supplement item to track."><Plus size={17} /> Add</Button>}
      />
      <div className="search-box">
        <Search size={18} />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search peptides" title="Search by peptide name or nickname." />
      </div>
      <div className="tabs-scroll">
        {categories.map((item) => (
          <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)} title={`Show ${item.toLowerCase()} peptide items.`}>
            {item}
          </button>
        ))}
      </div>
      {editing && (
        <div ref={editorRef}>
        <Card className="editor-panel active-editor">
          <div className="section-title">
            <div>
              <p className="eyebrow">{editing.id ? "Editing" : "New item"}</p>
              <h2>{editing.id ? editing.name : "Add Custom Peptide/Pill"}</h2>
            </div>
            <button className="text-button" onClick={() => setEditing(null)} title="Close this detail editor without changing screens.">Close</button>
          </div>
          <Input placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} title="Display name for this tracked item." />
          <Input placeholder="Nickname / short name" value={editing.nickname} onChange={(e) => setEditing({ ...editing, nickname: e.target.value })} title="Short label used in compact cards." />
          <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as Category })} title="Choose the primary tracking category.">
            {categories.filter((c) => c !== "All").map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Textarea placeholder="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} title="Plain-English tracking description. Not medical advice." />
          {!!editing.aliases?.length && <p className="subtle"><strong>Aliases:</strong> {editing.aliases.join(", ")}</p>}
          {!!editing.categoryTags?.length && <div className="chip-row">{editing.categoryTags.filter((tag) => tag.toLowerCase() !== "experimental").map((tag) => <span className="mini-chip" key={tag}>{tag}</span>)}</div>}
          {editing.mainReasonToTrack && <p className="subtle"><strong>Main reason to track:</strong> {editing.mainReasonToTrack}</p>}
          {!!editing.usefulMetrics?.length && <p className="subtle"><strong>Useful metrics:</strong> {editing.usefulMetrics.join(", ")}</p>}
          {!!editing.sideEffectsToMonitor?.length && <p className="subtle"><strong>Monitor:</strong> {editing.sideEffectsToMonitor.join(", ")}</p>}
          {editing.evidenceLevel && <p className="subtle"><strong>Evidence level:</strong> {editing.evidenceLevel}</p>}
          {editing.storageNotes && <p className="subtle"><strong>Storage / handling:</strong> {editing.storageNotes}</p>}
          {editing.cautionNotes && <p className="disclaimer"><strong>Caution notes:</strong> {editing.cautionNotes}</p>}
          <div className="two-col">
            <Select value={editing.doseUnit} onChange={(e) => setEditing({ ...editing, doseUnit: e.target.value as DoseUnit })} title="Choose the unit for user-entered dose notes.">
              {units.map((unit) => <option key={unit}>{unit}</option>)}
            </Select>
            <Input placeholder="Default dose" value={editing.defaultDose} onChange={(e) => setEditing({ ...editing, defaultDose: e.target.value })} title="Optional default amount saved as your personal note." />
          </div>
          <Textarea placeholder="Notes" value={editing.notes === "Tracking reference only." ? "" : editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} title="Private notes for tracking context." />
          <p className="disclaimer">Safety disclaimer: PeptideX is for tracking user-entered protocol notes only and does not provide medical advice.</p>
          <Button onClick={savePeptide} title="Save this peptide profile to local storage.">Save peptide</Button>
        </Card>
        </div>
      )}

      <div className="stack">
        {peptides.map((peptide) => <PeptideCard key={peptide.id} peptide={peptide} onClick={() => setEditing(peptide)} />)}
      </div>
    </div>
  );
}
