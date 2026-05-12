import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { AlertTriangle, Camera, Download, Lock, Plus, Shield, Sparkles, Target } from "lucide-react";
import { Heatmap } from "../components/Heatmap";
import { Button, Card, Input, ScreenHeader, Select, Textarea } from "../components/ui";
import {
  bestWorstPeriod,
  calculateScores,
  changeDetection,
  chartSeriesForMetric,
  exportCsv,
  exportJson,
  generateInsights,
  getAppStats,
  inventoryMath,
  metricEntriesFor,
  metricTrend,
  movingAverage,
  timeWindow,
} from "../lib/calculations";
import { AppState, ChartRange, CheckInMode, MetricConfig, MetricEntry, MetricInputType, ScheduledDose, TimelineFilter } from "../types";

const modules = ["Weight", "Body measurements", "Mood", "Energy", "Sleep", "Skin", "Pain/recovery", "Side effects", "Libido", "Workouts", "Photos", "Labs", "Custom metric"];
const inputTypes: MetricInputType[] = ["rating-5", "rating-10", "yes-no", "numeric", "text", "photo"];
const ranges: ChartRange[] = ["7D", "30D", "90D", "6M", "1Y", "All"];
const timelineFilters: TimelineFilter[] = ["All", "Doses", "Metrics", "Photos", "Notes", "Side effects"];

export function AnalyticsScreen({
  state,
  setState,
}: {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  scheduledDoses: ScheduledDose[];
}) {
  const [mode, setMode] = useState<CheckInMode>("Quick Check-In");
  const [range, setRange] = useState<ChartRange>("30D");
  const [overlayMetricId, setOverlayMetricId] = useState("metric-sleep-quality");
  const [showAverage, setShowAverage] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("All");
  const [journalText, setJournalText] = useState("");
  const [customMetricName, setCustomMetricName] = useState("");
  const stats = getAppStats(state);
  const scores = calculateScores(state);
  const enabledMetrics = state.metricConfigs.filter((metric) => metric.enabled);
  const dashboardMetrics = enabledMetrics.filter((metric) => metric.showOnDashboard);
  const checkInMetrics = mode === "Quick Check-In"
    ? enabledMetrics.filter((metric) => metric.quickEntry).slice(0, 5)
    : mode === "Full Check-In"
      ? enabledMetrics
      : enabledMetrics.slice(0, 1);
  const insights = useMemo(() => [...generateInsights(state), ...changeDetection(state)], [state]);
  const timeline = useMemo(() => buildTimeline(state, timelineFilter), [state, timelineFilter]);
  const weightSeries = chartSeriesForMetric(state, "metric-weight", range === "7D" ? 7 : range === "30D" ? 12 : 24);
  const overlaySeries = chartSeriesForMetric(state, overlayMetricId, weightSeries.length);

  const windows = ["morning", "afternoon", "evening", "before bed"].map((window) => {
    const missed = state.doseLogs.filter((log) => log.status === "missed" && timeWindow(log.loggedAt) === window).length;
    return { window, missed };
  });

  const updateMetricConfig = (metric: MetricConfig) => {
    setState((current) => ({
      ...current,
      metricConfigs: current.metricConfigs.map((item) => item.id === metric.id ? metric : item),
    }));
  };

  const logMetric = (metric: MetricConfig, value: string) => {
    if (!value) return;
    const parsedValue = metric.inputType === "yes-no" ? value === "yes" : metric.inputType === "numeric" || metric.inputType.startsWith("rating") ? Number(value) : value;
    const entry: MetricEntry = {
      id: `metric-entry-${crypto.randomUUID()}`,
      metricId: metric.id,
      date: new Date().toISOString(),
      value: parsedValue,
    };
    setState((current) => ({ ...current, metricEntries: [entry, ...current.metricEntries] }));
  };

  const addJournal = () => {
    if (!journalText.trim()) return;
    setState((current) => ({
      ...current,
      journalEntries: [
        { id: `journal-${crypto.randomUUID()}`, date: new Date().toISOString(), type: "journal", title: "Freeform note", body: journalText },
        ...current.journalEntries,
      ],
    }));
    setJournalText("");
  };

  const addCustomMetric = () => {
    if (!customMetricName.trim()) return;
    const metric: MetricConfig = {
      id: `metric-custom-${crypto.randomUUID()}`,
      name: customMetricName,
      category: "Custom",
      inputType: "numeric",
      frequency: "As needed",
      goalDirection: "Informational only",
      enabled: true,
      showOnDashboard: true,
      showInAnalytics: true,
      quickEntry: false,
    };
    setState((current) => ({ ...current, metricConfigs: [...current.metricConfigs, metric] }));
    setCustomMetricName("");
  };

  const download = (name: string, text: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="screen analytics-screen">
      <ScreenHeader eyebrow="Progress" title="Analytics" />

      {!state.onboardingComplete && (
        <Card>
          <p className="eyebrow">Onboarding</p>
          <h2>Choose what you want to track</h2>
          <p className="subtle">PeptideX only shows enabled modules. Track weight + sleep, mood + side effects, photos only, or everything.</p>
          <div className="module-grid">{modules.map((module) => <span key={module}>{module}</span>)}</div>
          <Button onClick={() => setState((current) => ({ ...current, onboardingComplete: true }))} title="Keep the current enabled tracking modules and hide this onboarding card.">Use current setup</Button>
        </Card>
      )}

      <div className="score-strip">
        <span><strong>{scores.daily}</strong><small>Daily</small></span>
        <span><strong>{scores.weekly}</strong><small>Weekly</small></span>
        <span><strong>{scores.recovery}</strong><small>Recovery</small></span>
        <span><strong>{scores.consistency}%</strong><small>Consistency</small></span>
      </div>

      <Card className="score-breakdown">
        <p className="eyebrow">Score breakdown</p>
        {[
          ["Adherence", scores.consistency],
          ["Sleep", Number(scores.factors[1]?.match(/\d+/)?.[0] || 0)],
          ["Mood", Number(scores.factors[2]?.match(/\d+/)?.[0] || 0)],
          ["Recovery", scores.recovery],
        ].map(([label, value]) => (
          <div className="breakdown-row" key={label}>
            <span>{label}</span>
            <i><b style={{ width: `${value}%` }} /></i>
            <strong>{value}%</strong>
          </div>
        ))}
      </Card>

      <Card>
        <p className="eyebrow">Trends</p>
        <div className="range-row">{ranges.map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)} title={`Show chart data for ${item}.`}>{item}</button>)}</div>
        <div className="two-col mt-12">
          <Select value={overlayMetricId} onChange={(e) => setOverlayMetricId(e.target.value)} title="Choose a second metric to overlay on the chart.">
            {enabledMetrics.map((metric) => <option key={metric.id} value={metric.id}>{metric.name}</option>)}
          </Select>
          <label className="toggle-line" title="Smooth the chart with a short moving average."><input type="checkbox" checked={showAverage} onChange={(e) => setShowAverage(e.target.checked)} /> Moving average</label>
        </div>
        <ChartCard title="Weight trend" series={weightSeries} overlay={overlaySeries} showAverage={showAverage} />
      </Card>

      <div className="insight-strip">
        <MiniChartCard title="Sleep quality improving" metricId="metric-sleep-quality" state={state} />
        <MiniChartCard title="Mood stable last 14 days" metricId="metric-mood" state={state} />
        <MiniChartCard title="Energy variability increased" metricId="metric-energy" state={state} />
      </div>

      <Card>
        <p className="eyebrow">Daily check-in</p>
        <div className="segmented">
          {(["Quick Check-In", "Full Check-In", "Custom Log Entry"] as CheckInMode[]).map((item) => (
            <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)} title={`${item} controls how many enabled metrics appear.`}>{item.replace(" Check-In", "")}</button>
          ))}
        </div>
        <div className="stack tight mt-12">
          {checkInMetrics.map((metric) => <MetricLogger key={metric.id} metric={metric} onLog={logMetric} />)}
          {!checkInMetrics.length && <p className="subtle">Enable at least one metric to start check-ins.</p>}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Enabled dashboard metrics</p>
        <div className="metric-dashboard">
          {dashboardMetrics.map((metric) => {
            const entries = metricEntriesFor(state, metric.id);
            const trend = metricTrend(state, metric.id);
            return (
              <div key={metric.id} className="metric-tile">
                <span>{metric.name}</span>
                <strong>{entries[entries.length - 1]?.value ?? "--"}{metric.unit ? ` ${metric.unit}` : ""}</strong>
                <small>{trend ? `${trend.change >= 0 ? "+" : ""}${trend.change} trend` : "Not enough data yet. Log this a few more times to see trends."}</small>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Calendar</p>
        <CalendarGrid state={state} />
      </Card>

      <Card>
        <p className="eyebrow">Inventory & supply</p>
        <h2 className="card-heading">Inventory & Supply</h2>
        <div className="stack tight">
          {state.inventoryItems.map((item) => {
            const peptide = state.peptides.find((pep) => pep.id === item.peptideId);
            const math = inventoryMath(item);
            return (
              <div className={`inventory-card ${math.lowSupply ? "low" : ""}`} key={item.id}>
                <div><strong>{peptide?.name || "Inventory item"}</strong><span>{item.vialAmountMg}mg vial + {item.bacWaterMl}mL BAC water</span></div>
                <div className="inventory-grid">
                  <span>Concentration<strong>{math.concentration} mg/mL</strong></span>
                  <span>Remaining<strong>{math.remainingMg} mg</strong></span>
                  <span>Doses left<strong>{math.dosesRemaining}</strong></span>
                  <span>Refill est.<strong>{math.refillDate}</strong></span>
                </div>
                <p className="subtle">Tracking calculator only. Supplier: {item.supplier}. Lot: {item.lotNumber}. Monthly spend: ${item.monthlySpend}.</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Protocol comparison</p>
        <div className="compare-panel">
          <div><span>Protocol A</span><strong>95%</strong><small>adherence</small></div>
          <div><span>Protocol B</span><strong>88%</strong><small>adherence</small></div>
          <div><span>Improvement</span><strong>+7%</strong><small>completion</small></div>
        </div>
        <p className="subtle mt-12">Comparison cards summarize averages, metric deltas, side-effect frequency, and adherence differences across protocol date ranges.</p>
      </Card>

      <Card>
        <p className="eyebrow">Smart timeline</p>
        <div className="tabs-scroll">{timelineFilters.map((item) => <button key={item} className={timelineFilter === item ? "active" : ""} onClick={() => setTimelineFilter(item)} title={`Filter timeline to ${item.toLowerCase()}.`}>{item}</button>)}</div>
        <Textarea className="mt-12" placeholder="Add a freeform journal entry" value={journalText} onChange={(e) => setJournalText(e.target.value)} title="Write a private timeline note." />
        <Button className="mt-12" onClick={addJournal} title="Add this note to your local timeline.">Add journal entry</Button>
        <div className="timeline">
          {timeline.map((entry) => <div key={entry.id}><span>{new Date(entry.date).toLocaleDateString()} - {entry.type}</span><strong>{entry.title}</strong><p>{entry.body}</p></div>)}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Progress photos</p>
        <div className="photo-compare">
          {state.progressPhotos.map((photo) => <div key={photo.id}><Camera size={22} /><strong>{photo.label}</strong><span>{photo.date} - {photo.angle}</span></div>)}
        </div>
        <p className="subtle mt-12">Front, side, back, swipe comparison, before/after mode, and monthly collage generation are local-first placeholders.</p>
      </Card>

      <Card>
        <p className="eyebrow">Recovery body map</p>
        <div className="body-map">
          {["Neck", "Shoulder", "Back", "Elbow", "Knee", "Ankle"].map((area) => <button key={area} title={`Body map placeholder for ${area} notes/photos.`}>{area}</button>)}
        </div>
        {state.recoveryEntries.map((entry) => (
          <div className="insight-row" key={entry.id}><Target size={16} /> {entry.injuryType}: {entry.recoveryPercent}% recovered, {entry.painLocation}, mobility {entry.mobility}/10.</div>
        ))}
      </Card>

      <Card>
        <p className="eyebrow">Lab results</p>
        <div className="lab-grid">
          {state.labResults.map((lab) => <span key={lab.id}>{lab.name}<strong>{lab.value} {lab.unit}</strong><small>{lab.targetRange}</small></span>)}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Correlation cards</p>
        <div className="stack tight">{insights.map((insight) => <div className="insight-row" key={insight}><Sparkles size={16} /> {insight}</div>)}</div>
      </Card>

      <Card>
        <p className="eyebrow">Metric modules & settings</p>
        <div className="stack tight">
          {state.metricConfigs.map((metric) => (
            <div className="metric-config" key={metric.id}>
              <label title="Enable or hide this metric throughout the app."><input type="checkbox" checked={metric.enabled} onChange={(e) => updateMetricConfig({ ...metric, enabled: e.target.checked })} /> {metric.name}</label>
              <Input value={metric.name} onChange={(e) => updateMetricConfig({ ...metric, name: e.target.value })} title="Rename this metric." />
              <Select value={metric.inputType} onChange={(e) => updateMetricConfig({ ...metric, inputType: e.target.value as MetricInputType })} title="Choose how this metric is entered.">
                {inputTypes.map((type) => <option key={type}>{type}</option>)}
              </Select>
              <div className="toggle-pair">
                <label title="Show this metric in Quick Check-In."><input type="checkbox" checked={metric.quickEntry} onChange={(e) => updateMetricConfig({ ...metric, quickEntry: e.target.checked })} /> Quick</label>
                <label title="Show this metric on dashboard cards."><input type="checkbox" checked={metric.showOnDashboard} onChange={(e) => updateMetricConfig({ ...metric, showOnDashboard: e.target.checked })} /> Dashboard</label>
                <label title="Include this metric in analytics and trend cards."><input type="checkbox" checked={metric.showInAnalytics} onChange={(e) => updateMetricConfig({ ...metric, showInAnalytics: e.target.checked })} /> Analytics</label>
              </div>
            </div>
          ))}
        </div>
        <div className="two-col mt-12"><Input placeholder="Custom metric name" value={customMetricName} onChange={(e) => setCustomMetricName(e.target.value)} title="Name a custom metric you want to track." /><Button onClick={addCustomMetric} title="Create a new configurable custom metric."><Plus size={16} /> Add</Button></div>
      </Card>

      <Card>
        <p className="eyebrow">Calendar heatmap</p>
        <Heatmap logs={state.doseLogs} />
      </Card>

      <Card>
        <p className="eyebrow">Missed by time window</p>
        <div className="window-grid">{windows.map((item) => <span key={item.window}>{item.window}<strong>{item.missed}</strong></span>)}</div>
      </Card>

      <Card className="insight-card">
        <AlertTriangle size={20} />
        <div><h3>Future AI + iOS widgets</h3><p>Protocol recommendations, plateau detection, symptom clustering, predictive adherence, "what changed?", next-dose widgets, streak widgets, quick-log buttons, and mini charts are architected as placeholders.</p></div>
      </Card>

      <Card>
        <p className="eyebrow">Export</p>
        <div className="export-row">
          <Button onClick={() => download("peptidex-export.json", exportJson(state), "application/json")} title="Export all local data as JSON."><Download size={16} /> JSON</Button>
          <Button variant="ghost" onClick={() => download("peptidex-export.csv", exportCsv(state), "text/csv")} title="Export logs, metrics, and journal entries as CSV."><Download size={16} /> CSV</Button>
          <Button variant="ghost" onClick={() => window.print()} title="Open the browser print dialog to save a PDF report."><Download size={16} /> PDF</Button>
        </div>
        <p className="subtle mt-12">Chart image export is represented by browser PDF/image workflow placeholders for now.</p>
      </Card>

      <Card>
        <p className="eyebrow">Security & privacy</p>
        <div className="privacy-row"><Shield size={18} /> Local-first. Health data is not shared. You own the data stored in this browser.</div>
        <label className="toggle-line" title="Placeholder for a future local passcode screen."><input type="checkbox" checked={state.privacySettings.passcodeEnabled} onChange={(e) => setState((current) => ({ ...current, privacySettings: { ...current.privacySettings, passcodeEnabled: e.target.checked } }))} /> Optional passcode lock placeholder</label>
        <label className="toggle-line" title="Placeholder for FaceID after converting to native iOS."><input type="checkbox" checked={state.privacySettings.faceIdPlaceholderEnabled} onChange={(e) => setState((current) => ({ ...current, privacySettings: { ...current.privacySettings, faceIdPlaceholderEnabled: e.target.checked } }))} /> FaceID placeholder for native iOS</label>
      </Card>

      <Card className="pro-card">
        <Lock size={22} />
        <div><p className="eyebrow">Pro placeholder</p><h2>Advanced PeptideX Pro</h2><p>Locked placeholders: advanced analytics, correlation engine, health integrations, unlimited protocols, AI insights, cloud backup, advanced exports, and premium widgets. Payments are not implemented.</p></div>
      </Card>
    </div>
  );
}

function MetricLogger({ metric, onLog }: { metric: MetricConfig; onLog: (metric: MetricConfig, value: string) => void }) {
  const [value, setValue] = useState("");
  const ratingMax = metric.inputType === "rating-5" ? 5 : metric.inputType === "rating-10" ? 10 : 0;
  return (
    <div className="metric-log-row">
      <div><strong>{metric.name}</strong><span>{metric.frequency} - {metric.goalDirection}</span></div>
      {ratingMax ? (
        <div className="quick-rating">
          {Array.from({ length: ratingMax }, (_, index) => String(index + 1)).map((rating) => (
            <button key={rating} className={value === rating ? "active" : ""} onClick={() => setValue(rating)} title={`Set ${metric.name} to ${rating}.`}>{rating}</button>
          ))}
        </div>
      ) : metric.inputType === "yes-no" ? (
        <Select value={value} onChange={(e) => setValue(e.target.value)} title={`Log a yes/no value for ${metric.name}.`}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option></Select>
      ) : (
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={metric.inputType.startsWith("rating") ? metric.inputType.replace("rating-", "1-") : metric.unit || "Value"} type={metric.inputType === "numeric" || metric.inputType.startsWith("rating") ? "number" : "text"} title={`Enter a value for ${metric.name}.`} />
      )}
      <Button onClick={() => { onLog(metric, value); setValue(""); }} title={`Save this ${metric.name} entry.`}>Log</Button>
    </div>
  );
}

function ChartCard({ title, series, overlay, showAverage }: { title: string; series: { label: string; value: number }[]; overlay: { label: string; value: number }[]; showAverage: boolean }) {
  const values = series.map((point) => point.value);
  const avg = movingAverage(values);
  const period = bestWorstPeriod(values);
  const max = Math.max(...values, ...overlay.map((point) => point.value), 1);
  return (
    <div className="premium-chart">
      <div className="row-between"><h3>{title}</h3><span>Best {period.best} / Worst {period.worst}</span></div>
      <div className="line-chart">
        {series.map((point, index) => <i key={point.label} style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} />)}
        {overlay.map((point) => <b key={point.label} style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} />)}
        {showAverage && avg.map((value, index) => <em key={index} style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />)}
      </div>
    </div>
  );
}

function MiniChartCard({ title, metricId, state }: { title: string; metricId: string; state: AppState }) {
  const series = chartSeriesForMetric(state, metricId, 8);
  const trend = metricTrend(state, metricId);
  const max = Math.max(...series.map((point) => point.value), 1);
  return (
    <Card className="mini-chart-card">
      <p className="eyebrow">{title}</p>
      <div className="spark-bars">{series.map((point) => <span key={point.label} style={{ height: `${Math.max(14, (point.value / max) * 100)}%` }} />)}</div>
      <strong>{trend ? `${trend.change >= 0 ? "+" : ""}${trend.change}` : "Not enough data"}</strong>
    </Card>
  );
}

function CalendarGrid({ state }: { state: AppState }) {
  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (34 - index));
    const key = date.toISOString().slice(0, 10);
    const logs = state.doseLogs.filter((log) => log.loggedAt.startsWith(key));
    const metricCount = state.metricEntries.filter((entry) => entry.date.startsWith(key)).length;
    const status = logs.some((log) => log.status === "missed") ? "missed" : logs.length && logs.every((log) => log.status === "taken") ? "complete" : logs.length || metricCount ? "partial" : "";
    return { key, day: date.getDate(), status, events: logs.length + metricCount };
  });
  return <div className="calendar-grid">{days.map((day) => <button key={day.key} className={day.status} title={`${day.key}: ${day.events} events`}><span>{day.day}</span></button>)}</div>;
}

function buildTimeline(state: AppState, filter: TimelineFilter) {
  const recentTakenIds = new Set(
    state.doseLogs
      .filter((log) => log.status === "taken")
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
      .slice(0, 5)
      .map((log) => log.id)
  );
  const doseEntries = state.doseLogs
    .filter((log) => log.status !== "taken" || recentTakenIds.has(log.id))
    .map((log) => ({ id: log.id, date: log.loggedAt, type: "Doses", title: log.status === "taken" ? "Dose taken" : "Dose update", body: `Marked ${log.status}${log.notes ? ` · ${log.notes}` : ""}` }));
  const metricEntries = state.metricEntries.map((entry) => {
    const metric = state.metricConfigs.find((config) => config.id === entry.metricId);
    return { id: entry.id, date: entry.date, type: metric?.category === "Side Effects" ? "Side effects" : "Metrics", title: `${metric?.name || "Metric"} logged`, body: `Value: ${entry.value}` };
  });
  const photoEntries = state.progressPhotos.map((photo) => ({ id: photo.id, date: photo.date, type: "Photos", title: photo.label, body: photo.notes || "Progress photo placeholder." }));
  const noteEntries = state.journalEntries.map((entry) => ({ id: entry.id, date: entry.date, type: "Notes", title: entry.title, body: entry.body }));
  const all = [...doseEntries, ...metricEntries, ...photoEntries, ...noteEntries].sort((a, b) => b.date.localeCompare(a.date));
  return filter === "All" ? all : all.filter((entry) => entry.type === filter);
}
