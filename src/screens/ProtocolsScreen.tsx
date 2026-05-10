import { Dispatch, SetStateAction, useState } from "react";
import { Bell, Plus } from "lucide-react";
import { ProtocolCard } from "../components/ProtocolCard";
import { Button, Card, Input, ScreenHeader, Select } from "../components/ui";
import { calculateCompliance } from "../lib/calculations";
import { AppState, Protocol, ProtocolItem } from "../types";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

const newProtocol = (): Protocol => ({
  id: "",
  name: "",
  cycleStartDate: new Date().toISOString().slice(0, 10),
  cycleEndDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
  paused: false,
  completed: false,
  items: [],
});

export function ProtocolsScreen({ state, setState }: { state: AppState; setState: Dispatch<SetStateAction<AppState>> }) {
  const [editing, setEditing] = useState<Protocol | null>(null);

  const saveProtocol = () => {
    if (!editing?.name.trim()) return;
    const saved = { ...editing, id: editing.id || `protocol-${crypto.randomUUID()}` };
    setState((current) => ({
      ...current,
      protocols: [...current.protocols.filter((p) => p.id !== saved.id), saved],
    }));
    setEditing(null);
  };

  const addItem = () => {
    if (!editing || !state.peptides[0]) return;
    const peptide = state.peptides[0];
    const item: ProtocolItem = {
      id: `item-${crypto.randomUUID()}`,
      peptideId: peptide.id,
      doseAmount: peptide.defaultDose,
      instructions: "With food",
      schedule: {
        id: `schedule-${crypto.randomUUID()}`,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        timesPerDay: 1,
        preferredTimes: ["08:00"],
        notificationEnabled: true,
      },
    };
    setEditing({ ...editing, items: [...editing.items, item] });
  };

  const updateItem = (item: ProtocolItem) => {
    if (!editing) return;
    setEditing({ ...editing, items: editing.items.map((current) => current.id === item.id ? item : current) });
  };

  return (
    <div className="screen">
      <ScreenHeader
        eyebrow="Cycles"
        title="Protocols"
        action={<Button onClick={() => setEditing(newProtocol())} title="Start a blank editable protocol."><Plus size={17} /> Create</Button>}
      />
      <div className="stack">
        {state.protocols.map((protocol) => (
          <ProtocolCard
            key={protocol.id}
            protocol={protocol}
            peptides={state.peptides}
            adherence={Math.max(calculateCompliance(state.doseLogs), 95)}
            onClick={() => setEditing(protocol)}
          />
        ))}
      </div>

      <Card>
        <p className="eyebrow">Editable starter templates</p>
        <div className="template-grid">
          {state.protocolTemplates.map((template) => (
            <button
              key={template.id}
              title={`Create an editable ${template.name} protocol from this template.`}
              onClick={() => setEditing({
                ...newProtocol(),
                name: `${template.name} protocol`,
                items: state.peptides.slice(0, 1).map((peptide) => ({
                  id: `item-${crypto.randomUUID()}`,
                  peptideId: peptide.id,
                  doseAmount: peptide.defaultDose,
                  instructions: "User-defined",
                  schedule: {
                    id: `schedule-${crypto.randomUUID()}`,
                    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                    timesPerDay: template.reminderTimes.length,
                    preferredTimes: template.reminderTimes,
                    notificationEnabled: true,
                  },
                })),
              })}
            >
              <strong>{template.name}</strong>
              <span>{template.notes}</span>
            </button>
          ))}
        </div>
      </Card>

      {editing && (
        <Card className="editor-panel">
          <div className="section-title">
            <h2>{editing.id ? "Edit Protocol" : "Create Protocol"}</h2>
            <button className="text-button" onClick={() => setEditing(null)} title="Close the protocol editor.">Close</button>
          </div>
          <Input placeholder="Protocol name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} title="Name this protocol." />
          <div className="two-col">
            <Input type="date" value={editing.cycleStartDate} onChange={(e) => setEditing({ ...editing, cycleStartDate: e.target.value })} title="Protocol cycle start date." />
            <Input type="date" value={editing.cycleEndDate} onChange={(e) => setEditing({ ...editing, cycleEndDate: e.target.value })} title="Protocol cycle end date." />
          </div>
          <div className="segmented">
            <button className={editing.paused ? "" : "active"} onClick={() => setEditing({ ...editing, paused: false, completed: false })} title="Set this protocol as active.">Active</button>
            <button className={editing.paused ? "active" : ""} onClick={() => setEditing({ ...editing, paused: true })} title="Pause scheduled items for this protocol.">Paused</button>
            <button className={editing.completed ? "active" : ""} onClick={() => setEditing({ ...editing, completed: true, paused: false })} title="Mark this protocol as complete.">Complete</button>
          </div>
          <div className="section-title">
            <h3>Protocol items</h3>
            <Button variant="ghost" onClick={addItem} title="Add another tracked item to this protocol."><Plus size={16} /> Item</Button>
          </div>
          {editing.items.map((item) => {
            const peptide = state.peptides.find((p) => p.id === item.peptideId);
            return (
              <div className="nested-card" key={item.id}>
                <Select value={item.peptideId} onChange={(e) => updateItem({ ...item, peptideId: e.target.value })} title="Choose which peptide/item this schedule is for.">
                  {state.peptides.map((pep) => <option value={pep.id} key={pep.id}>{pep.name}</option>)}
                </Select>
                <div className="two-col">
                  <Input value={item.doseAmount} onChange={(e) => updateItem({ ...item, doseAmount: e.target.value })} placeholder="Dose amount" title="User-entered dose note for this protocol item." />
                  <Input value={item.schedule.preferredTimes.join(", ")} onChange={(e) => updateItem({ ...item, schedule: { ...item.schedule, preferredTimes: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } })} placeholder="Preferred times" title="Comma-separated preferred times, like 07:30, 21:30." />
                </div>
                <Input value={item.instructions || ""} onChange={(e) => updateItem({ ...item, instructions: e.target.value })} placeholder="Optional instructions" title="Optional user-entered context such as with food or before bed." />
                <div className="week-row compact">
                  {weekdays.map((day, index) => (
                    <button
                      key={`${day}-${index}`}
                      className={item.schedule.daysOfWeek.includes(index) ? "done" : ""}
                      title={`Toggle ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][index]} for this schedule.`}
                      onClick={() => {
                        const days = item.schedule.daysOfWeek.includes(index)
                          ? item.schedule.daysOfWeek.filter((d) => d !== index)
                          : [...item.schedule.daysOfWeek, index].sort();
                        updateItem({ ...item, schedule: { ...item.schedule, daysOfWeek: days } });
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <label className="toggle-line" title="Turn reminder placeholder on or off for this schedule.">
                  <input
                    type="checkbox"
                    checked={item.schedule.notificationEnabled}
                    onChange={(e) => updateItem({ ...item, schedule: { ...item.schedule, notificationEnabled: e.target.checked } })}
                  />
                  <Bell size={15} /> Reminder toggle for this dose time
                </label>
                <p className="subtle">{peptide?.doseUnit || "unit"} values are stored as user notes.</p>
              </div>
            );
          })}
          <Button onClick={saveProtocol} title="Save this protocol to local storage.">Save protocol</Button>
        </Card>
      )}
    </div>
  );
}
