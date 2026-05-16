import { Dispatch, SetStateAction, useState } from "react";
import { Bell, Plus } from "lucide-react";
import { ProtocolCard } from "../components/ProtocolCard";
import { Button, Card, Input, ScreenHeader, Select, Textarea, Toggle } from "../components/ui";
import { calculateCompliance, getCycleStatus, getCurrentTitrationPhase, vialMathForItem } from "../lib/calculations";
import { addLocalDays, localDateInputValue } from "../lib/dates";
import { AppState, DoseMethod, DoseType, DoseUnit, DurationUnit, FrequencyType, Protocol, ProtocolItem, TitrationPhase } from "../types";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const doseUnits: DoseUnit[] = ["mcg", "mg", "IU", "units", "mL", "capsule", "tablet"];
const measuredDoseUnits: Array<"mcg" | "mg" | "IU"> = ["mcg", "mg", "IU"];
const methods: DoseMethod[] = ["SubQ", "IM", "IV", "Oral", "Nasal", "Other"];
const frequencies: FrequencyType[] = ["Daily", "Set Days", "Interval"];
const durationUnits: DurationUnit[] = ["days", "weeks"];

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
  cycleStartDate: localDateInputValue(),
  cycleEndDate: localDateInputValue(addLocalDays(new Date(), 45)),
  noEndDate: false,
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

  const deleteProtocolById = (protocolId: string) => {
    setState((current) => ({
      ...current,
      protocols: current.protocols.filter((protocol) => protocol.id !== protocolId),
      doseLogs: current.doseLogs.filter((log) => !log.scheduledDoseId.startsWith(`${protocolId}-`)),
    }));
  };

  const deleteProtocol = () => {
    if (!editing?.id) return;
    deleteProtocolById(editing.id);
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
      method: "SubQ",
      doseType: "Fixed Dose",
      titrationPhases: [],
      schedule: {
        id: `schedule-${crypto.randomUUID()}`,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        timesPerDay: 1,
        preferredTimes: ["08:00"],
        notificationEnabled: true,
        frequencyType: "Daily",
      },
    };
    setEditing({ ...editing, items: [...editing.items, item] });
  };

  const updateItem = (item: ProtocolItem) => {
    if (!editing) return;
    setEditing({ ...editing, items: editing.items.map((current) => current.id === item.id ? item : current) });
  };

  const newPhase = (index: number, item: ProtocolItem): TitrationPhase => ({
    id: `phase-${crypto.randomUUID()}`,
    name: `Step ${index + 1}`,
    amount: item.doseAmount || "",
    unit: (measuredDoseUnits.includes(item.doseUnit as "mcg" | "mg" | "IU") ? item.doseUnit : "mg") as "mcg" | "mg" | "IU",
    frequency: item.schedule.frequencyType || "Daily",
    duration: 7,
    durationUnit: "days",
    notes: "",
  });

  if (editing) {
    return (
      <ProtocolEditor
        editing={editing}
        state={state}
        setEditing={setEditing}
        saveProtocol={saveProtocol}
        deleteProtocol={deleteProtocol}
        addItem={addItem}
        updateItem={updateItem}
        newPhase={newPhase}
      />
    );
  }

  return (
    <div className="screen">
      <ScreenHeader
        eyebrow="Cycles"
        title="Protocols"
        action={<Button variant="ghost" onClick={() => setEditing(newProtocol())} title="Start a blank editable protocol."><Plus size={17} /> Create</Button>}
      />
      <div className="stack">
        {state.protocols.map((protocol) => (
          <ProtocolCard
            key={protocol.id}
            protocol={protocol}
            peptides={state.peptides}
            adherence={calculateCompliance(state.doseLogs)}
            onClick={() => setEditing(protocol)}
            onDelete={() => deleteProtocolById(protocol.id)}
          />
        ))}
      </div>

      <Card className="template-section">
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

    </div>
  );
}

function ProtocolEditor({
  editing,
  state,
  setEditing,
  saveProtocol,
  deleteProtocol,
  addItem,
  updateItem,
  newPhase,
}: {
  editing: Protocol;
  state: AppState;
  setEditing: Dispatch<SetStateAction<Protocol | null>>;
  saveProtocol: () => void;
  deleteProtocol: () => void;
  addItem: () => void;
  updateItem: (item: ProtocolItem) => void;
  newPhase: (index: number, item: ProtocolItem) => TitrationPhase;
}) {
  return (
    <div className="screen protocol-workflow">
      <ScreenHeader
        eyebrow={editing.id ? "Edit protocol" : "Add protocol"}
        title={editing.id ? editing.name || "Edit Protocol" : "Create Protocol"}
        action={<button className="text-button" onClick={() => setEditing(null)} title="Cancel and return to protocols.">Cancel</button>}
      />
      <Card className="editor-panel protocol-workflow-panel">
          <div className="section-title">
            <h2>Basic Details</h2>
            <span>1 of 7</span>
          </div>
          <Input placeholder="Protocol name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} title="Name this protocol." />
          <div className="two-col">
            <Input type="date" value={editing.cycleStartDate} onChange={(e) => setEditing({ ...editing, cycleStartDate: e.target.value })} title="Protocol cycle start date." />
            {!editing.noEndDate && <Input type="date" value={editing.cycleEndDate} onChange={(e) => setEditing({ ...editing, cycleEndDate: e.target.value })} title="Protocol cycle end date." />}
          </div>
          <label className="toggle-line" title="Keep this protocol active without a planned end date.">
            <input
              type="checkbox"
              checked={!!editing.noEndDate}
              onChange={(e) => setEditing({ ...editing, noEndDate: e.target.checked })}
            />
            No end date
          </label>
          <div className="segmented">
            <button className={editing.paused ? "" : "active"} onClick={() => setEditing({ ...editing, paused: false, completed: false })} title="Set this protocol as active.">Active</button>
            <button className={editing.paused ? "active" : ""} onClick={() => setEditing({ ...editing, paused: true })} title="Pause scheduled items for this protocol.">Paused</button>
            <button className={editing.completed ? "active" : ""} onClick={() => setEditing({ ...editing, completed: true, paused: false })} title="Mark this protocol as complete.">Complete</button>
          </div>
          <div className="section-title">
            <h3>Schedule and Dose</h3>
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
                <div className="protocol-dose-grid">
                  <label className="field-label">
                    <span>Method</span>
                    <Select value={item.method || "SubQ"} onChange={(e) => updateItem({ ...item, method: e.target.value as DoseMethod })} title="User-selected route/method label for logs.">
                      {methods.map((method) => <option key={method}>{method}</option>)}
                    </Select>
                  </label>
                  <label className="field-label">
                    <span>Dose type</span>
                    <Select value={item.doseType || "Fixed Dose"} onChange={(e) => {
                      const doseType = e.target.value as DoseType;
                      updateItem({
                        ...item,
                        doseType,
                        titrationPhases: doseType === "Titration Protocol" && !item.titrationPhases?.length ? [newPhase(0, item)] : item.titrationPhases,
                      });
                    }} title="Choose fixed dose tracking or user-entered titration steps.">
                      <option>Fixed Dose</option>
                      <option>Titration Protocol</option>
                    </Select>
                  </label>
                </div>
                <div className="protocol-dose-grid">
                  <label className="field-label">
                    <span>Frequency</span>
                    <Select value={item.schedule.frequencyType || "Daily"} onChange={(e) => {
                      const frequencyType = e.target.value as FrequencyType;
                      updateItem({
                        ...item,
                        schedule: {
                          ...item.schedule,
                          frequencyType,
                          daysOfWeek: frequencyType === "Daily" ? [0, 1, 2, 3, 4, 5, 6] : item.schedule.daysOfWeek,
                        },
                      });
                    }} title="Choose how this item appears on the schedule.">
                      {frequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
                    </Select>
                  </label>
                  {item.schedule.frequencyType === "Interval" && (
                    <label className="field-label">
                      <span>Every X days</span>
                      <Input inputMode="numeric" value={item.schedule.intervalEvery ?? ""} onChange={(e) => updateItem({ ...item, schedule: { ...item.schedule, intervalEvery: e.target.value === "" ? undefined : Number(e.target.value) } })} onBlur={() => updateItem({ ...item, schedule: { ...item.schedule, intervalEvery: Math.max(1, item.schedule.intervalEvery || 1) } })} />
                    </label>
                  )}
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
                {item.schedule.frequencyType !== "Daily" && (
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
                )}
                <label className="field-label">
                  <span>Notes</span>
                  <Textarea value={item.notes || ""} onChange={(e) => updateItem({ ...item, notes: e.target.value })} placeholder="Optional user-entered protocol notes" />
                </label>
                {item.doseType === "Titration Protocol" && (
                  <TitrationEditor item={item} protocolStartDate={editing.cycleStartDate} updateItem={updateItem} newPhase={newPhase} />
                )}
                <AdvancedProtocolOptions item={item} updateItem={updateItem} protocolStartDate={editing.cycleStartDate} />
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
    </div>
  );
}

function TitrationEditor({
  item,
  protocolStartDate,
  updateItem,
  newPhase,
}: {
  item: ProtocolItem;
  protocolStartDate: string;
  updateItem: (item: ProtocolItem) => void;
  newPhase: (index: number, item: ProtocolItem) => TitrationPhase;
}) {
  const phases = item.titrationPhases || [];
  const currentPhase = getCurrentTitrationPhase(item, protocolStartDate);
  const updatePhase = (phase: TitrationPhase) => updateItem({
    ...item,
    titrationPhases: phases.map((current) => current.id === phase.id ? phase : current),
  });

  return (
    <div className="advanced-card">
      <div className="section-title">
        <div>
          <h3>Titration steps</h3>
          <span>Current: {currentPhase?.name || "Not started"}</span>
        </div>
        <Button variant="ghost" onClick={() => updateItem({ ...item, titrationPhases: [...phases, newPhase(phases.length, item)] })}><Plus size={14} /> Add Step</Button>
      </div>
      <div className="stack tight">
        {phases.map((phase, index) => (
          <div className="phase-row" key={phase.id}>
            <div className="protocol-dose-grid">
              <Input value={phase.name} onChange={(e) => updatePhase({ ...phase, name: e.target.value })} placeholder={`Step ${index + 1}`} />
              <Select value={phase.frequency} onChange={(e) => updatePhase({ ...phase, frequency: e.target.value as FrequencyType })}>
                {frequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
              </Select>
            </div>
            <div className="protocol-dose-grid">
              <Input value={phase.amount} onChange={(e) => updatePhase({ ...phase, amount: e.target.value })} placeholder="Amount" />
              <Select value={phase.unit} onChange={(e) => updatePhase({ ...phase, unit: e.target.value as "mcg" | "mg" | "IU" })}>
                {measuredDoseUnits.map((unit) => <option key={unit}>{unit}</option>)}
              </Select>
            </div>
            <div className="protocol-dose-grid">
              <Input inputMode="numeric" value={phase.duration} onChange={(e) => updatePhase({ ...phase, duration: e.target.value === "" ? "" : Number(e.target.value) })} onBlur={() => updatePhase({ ...phase, duration: Math.max(1, Number(phase.duration) || 1) })} placeholder="Duration" />
              <Select value={phase.durationUnit} onChange={(e) => updatePhase({ ...phase, durationUnit: e.target.value as DurationUnit })}>
                {durationUnits.map((unit) => <option key={unit}>{unit}</option>)}
              </Select>
            </div>
            <Textarea value={phase.notes || ""} onChange={(e) => updatePhase({ ...phase, notes: e.target.value })} placeholder="Optional notes" />
            <div className="row-actions">
              <Button variant="ghost" onClick={() => updateItem({ ...item, titrationPhases: [...phases, { ...phase, id: `phase-${crypto.randomUUID()}`, name: `${phase.name} copy` }] })}>Duplicate</Button>
              <Button variant="danger" onClick={() => updateItem({ ...item, titrationPhases: phases.filter((current) => current.id !== phase.id) })}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
      <p className="subtle">Steps are user-entered tracking phases, not recommendations.</p>
    </div>
  );
}

function AdvancedProtocolOptions({
  item,
  updateItem,
  protocolStartDate,
}: {
  item: ProtocolItem;
  updateItem: (item: ProtocolItem) => void;
  protocolStartDate: string;
}) {
  const vial = item.vialTracking || {
    enabled: false,
    label: "",
    totalAmount: "",
    unit: "mg" as const,
    reconstitutionVolume: "",
    volumeUnit: "mL" as const,
    startingSupply: "",
    remainingSupply: "",
    lowSupplyThreshold: "",
  };
  const cycling = item.cycling || {
    enabled: false,
    activeLength: 5,
    offLength: 2,
    unit: "days" as const,
    repeat: true,
    cycleStartDate: protocolStartDate,
  };
  const vialMath = vialMathForItem({ ...item, vialTracking: vial });
  const cycle = getCycleStatus({ ...item, cycling });

  return (
    <div className="advanced-card">
      <div className="advanced-toggle">
        <span><strong>Track Vial</strong><small>Inventory math from user-entered values</small></span>
        <Toggle checked={!!vial.enabled} onChange={(enabled) => updateItem({ ...item, vialTracking: { ...vial, enabled } })} label="Toggle vial tracking" />
      </div>
      {vial.enabled && (
        <div className="advanced-fields">
          <Input value={vial.label} onChange={(e) => updateItem({ ...item, vialTracking: { ...vial, label: e.target.value } })} placeholder="Vial name / label" />
          <div className="protocol-dose-grid">
            <Input value={vial.totalAmount} onChange={(e) => updateItem({ ...item, vialTracking: { ...vial, totalAmount: e.target.value } })} placeholder="Total amount" />
            <Select value={vial.unit} onChange={(e) => updateItem({ ...item, vialTracking: { ...vial, unit: e.target.value as "mg" | "mcg" | "IU" } })}>
              {measuredDoseUnits.map((unit) => <option key={unit}>{unit}</option>)}
            </Select>
          </div>
          <div className="protocol-dose-grid">
            <Input value={vial.reconstitutionVolume} onChange={(e) => updateItem({ ...item, vialTracking: { ...vial, reconstitutionVolume: e.target.value } })} placeholder="Liquid volume" />
            <Input value={vial.lowSupplyThreshold} onChange={(e) => updateItem({ ...item, vialTracking: { ...vial, lowSupplyThreshold: e.target.value } })} placeholder="Low alert doses" />
          </div>
          <div className="protocol-dose-grid">
            <Input value={vial.startingSupply} onChange={(e) => updateItem({ ...item, vialTracking: { ...vial, startingSupply: e.target.value } })} placeholder="Starting supply" />
            <Input value={vial.remainingSupply} onChange={(e) => updateItem({ ...item, vialTracking: { ...vial, remainingSupply: e.target.value } })} placeholder="Current remaining" />
          </div>
          <p className="subtle">Concentration: {vialMath?.concentration || 0} {vial.unit}/mL - {vialMath?.dosesRemaining || 0} estimated doses left.</p>
        </div>
      )}

      <div className="advanced-toggle">
        <span><strong>On/Off Cycling</strong><small>Show active and off phases in the schedule</small></span>
        <Toggle checked={!!cycling.enabled} onChange={(enabled) => updateItem({ ...item, cycling: { ...cycling, enabled } })} label="Toggle cycling" />
      </div>
      {cycling.enabled && (
        <div className="advanced-fields">
          <div className="protocol-dose-grid">
            <Input inputMode="numeric" value={cycling.activeLength} onChange={(e) => updateItem({ ...item, cycling: { ...cycling, activeLength: e.target.value === "" ? "" : Number(e.target.value) } })} onBlur={() => updateItem({ ...item, cycling: { ...cycling, activeLength: Math.max(1, Number(cycling.activeLength) || 1) } })} placeholder="Active length" />
            <Input inputMode="numeric" value={cycling.offLength} onChange={(e) => updateItem({ ...item, cycling: { ...cycling, offLength: e.target.value === "" ? "" : Number(e.target.value) } })} onBlur={() => updateItem({ ...item, cycling: { ...cycling, offLength: Math.max(0, Number(cycling.offLength) || 0) } })} placeholder="Off length" />
          </div>
          <div className="protocol-dose-grid">
            <Select value={cycling.unit} onChange={(e) => updateItem({ ...item, cycling: { ...cycling, unit: e.target.value as "days" | "weeks" } })}>
              <option>days</option>
              <option>weeks</option>
            </Select>
            <Input type="date" value={cycling.cycleStartDate} onChange={(e) => updateItem({ ...item, cycling: { ...cycling, cycleStartDate: e.target.value } })} />
          </div>
          <label className="toggle-line">
            <input type="checkbox" checked={cycling.repeat} onChange={(e) => updateItem({ ...item, cycling: { ...cycling, repeat: e.target.checked } })} />
            Repeat cycle
          </label>
          <p className="subtle">{cycle.label}{cycle.daysLeft !== null ? ` - ${cycle.daysLeft} days left in current phase` : ""}.</p>
        </div>
      )}
    </div>
  );
}
