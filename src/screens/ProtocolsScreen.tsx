import { Dispatch, SetStateAction, useState } from "react";
import { Bell, Plus } from "lucide-react";
import { ProtocolCard } from "../components/ProtocolCard";
import { Button, Card, Input, ScreenHeader, Select } from "../components/ui";
import { calculateCompliance } from "../lib/calculations";
import { AppState, DoseUnit, Protocol, ProtocolItem } from "../types";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const doseUnits: DoseUnit[] = ["mcg", "mg", "IU", "units", "mL", "capsule", "tablet"];

const toTimeParts = (time?: string) => {
  const [hourRaw = "8", minuteRaw = "00"] = (time || "08:00").split(":");
  const hour24 = Number(hourRaw);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour: String(hour12), minute: minuteRaw.padStart(2, "0"), period };
};

const fromTimeParts = (hour: string, minute: string, period: string) => {
  let hour24 = Number(hour);
  if (period === "PM" && hour24 !== 12) hour24 += 12;
  if (period === "AM" && hour24 === 12) hour24 = 0;
  return `${String(hour24).padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const displayTime = (time: string) => {
  const parts = toTimeParts(time);
  return `${parts.hour}:${parts.minute} ${parts.period}`;
};

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

  const deleteProtocol = () => {
    if (!editing?.id) return;
    setState((current) => ({
      ...current,
      protocols: current.protocols.filter((protocol) => protocol.id !== editing.id),
      doseLogs: current.doseLogs.filter((log) => !log.scheduledDoseId.startsWith(`${editing.id}-`)),
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
      doseUnit: peptide.doseUnit,
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
                  doseUnit: peptide.doseUnit,
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
            const time = item.schedule.preferredTimes[0] || "08:00";
            const timeParts = toTimeParts(time);
            return (
              <div className="nested-card" key={item.id}>
                <label className="field-label">
                  <span>Protocol item</span>
                  <Select value={item.peptideId} onChange={(e) => {
                    const selected = state.peptides.find((pep) => pep.id === e.target.value);
                    updateItem({ ...item, peptideId: e.target.value, doseUnit: item.doseUnit || selected?.doseUnit });
                  }} title="Choose which peptide/item this schedule is for.">
                  {state.peptides.map((pep) => <option value={pep.id} key={pep.id}>{pep.name}</option>)}
                  </Select>
                </label>
                <div className="protocol-dose-grid">
                  <label className="field-label">
                    <span>Dose amount</span>
                    <Input value={item.doseAmount} onChange={(e) => updateItem({ ...item, doseAmount: e.target.value })} placeholder="Example: .5" title="User-entered dose amount note for this protocol item." />
                  </label>
                  <label className="field-label">
                    <span>Dose measurement</span>
                    <Select value={item.doseUnit || peptide?.doseUnit || "mg"} onChange={(e) => updateItem({ ...item, doseUnit: e.target.value as DoseUnit })} title="Choose the measurement unit for this protocol item.">
                      {doseUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </Select>
                  </label>
                </div>
                <div className="time-builder">
                  <label className="field-label">
                    <span>Dose time</span>
                    <Select value={timeParts.hour} onChange={(e) => updateItem({ ...item, schedule: { ...item.schedule, preferredTimes: [fromTimeParts(e.target.value, timeParts.minute, timeParts.period)] } })} title="Choose the hour for this scheduled dose time.">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((hour) => <option key={hour}>{hour}</option>)}
                    </Select>
                  </label>
                  <label className="field-label">
                    <span>Minutes</span>
                    <Select value={timeParts.minute} onChange={(e) => updateItem({ ...item, schedule: { ...item.schedule, preferredTimes: [fromTimeParts(timeParts.hour, e.target.value, timeParts.period)] } })} title="Choose the minutes for this scheduled dose time.">
                      {["00", "15", "30", "45"].map((minute) => <option key={minute}>{minute}</option>)}
                    </Select>
                  </label>
                  <label className="field-label">
                    <span>AM / PM</span>
                    <Select value={timeParts.period} onChange={(e) => updateItem({ ...item, schedule: { ...item.schedule, preferredTimes: [fromTimeParts(timeParts.hour, timeParts.minute, e.target.value)] } })} title="Choose AM or PM for this scheduled dose time.">
                      <option>AM</option>
                      <option>PM</option>
                    </Select>
                  </label>
                </div>
                <p className="subtle">Scheduled for {displayTime(item.schedule.preferredTimes[0] || "08:00")}. Add more times later by creating additional protocol items.</p>
                <label className="field-label">
                  <span>Instructions / context</span>
                  <Input value={item.instructions || ""} onChange={(e) => updateItem({ ...item, instructions: e.target.value })} placeholder="Example: With food" title="Optional user-entered context such as with food or before bed." />
                </label>
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
                <p className="subtle">{item.doseUnit || peptide?.doseUnit || "unit"} values are stored as user notes.</p>
              </div>
            );
          })}
          <div className="editor-actions">
            {editing.id && <Button variant="danger" onClick={deleteProtocol} title="Delete this saved protocol and remove its generated logs.">Delete protocol</Button>}
            <Button onClick={saveProtocol} title="Save this protocol to local storage.">Save protocol</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
