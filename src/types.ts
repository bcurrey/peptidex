export type Category =
  | "Recovery"
  | "Growth"
  | "Cognitive"
  | "Sleep"
  | "Fat Loss"
  | "Immune"
  | "Custom";

export type DoseUnit = "mcg" | "mg" | "IU" | "units" | "mL" | "capsule" | "tablet";
export type DoseStatus = "taken" | "skipped" | "missed" | "snoozed";
export type DoseMethod = "SubQ" | "IM" | "IV" | "Oral" | "Nasal" | "Other";
export type FrequencyType = "Daily" | "Set Days" | "Interval";
export type DurationUnit = "days" | "weeks";
export type CycleUnit = "days" | "weeks";
export type DoseType = "Fixed Dose" | "Titration Protocol";
export type MetricCategory = "Body" | "Wellness" | "Sleep" | "Recovery" | "Skin" | "Fitness" | "Side Effects" | "Labs" | "Custom";
export type MetricInputType = "rating-5" | "rating-10" | "yes-no" | "numeric" | "text" | "photo";
export type MetricFrequency = "Daily" | "Weekly" | "Monthly" | "As needed";
export type GoalDirection = "Higher is better" | "Lower is better" | "Target range" | "Informational only";
export type CheckInMode = "Quick Check-In" | "Full Check-In" | "Custom Log Entry";
export type ChartRange = "7D" | "30D" | "90D" | "6M" | "1Y" | "All";
export type ChartType = "line" | "bar" | "area" | "heatmap" | "radar" | "correlation";
export type TimelineFilter = "All" | "Doses" | "Metrics" | "Photos" | "Notes" | "Side effects";
export type DashboardWidgetType =
  | "next-dose"
  | "streak"
  | "adherence"
  | "weight-trend"
  | "mood-trend"
  | "sleep-trend"
  | "protocol-progress"
  | "supply-remaining"
  | "recent-notes"
  | "insight-cards";
export type Goal =
  | "Muscle Recovery"
  | "Better Sleep"
  | "Cognitive Edge"
  | "Anti-Aging"
  | "Fat Loss"
  | "Immune Support"
  | "Joint Health"
  | "Stress Reduction";

export interface UserProfile {
  id: string;
  name: string;
  memberSince: string;
  goals: Goal[];
}

export interface Peptide {
  id: string;
  name: string;
  nickname: string;
  category: Category;
  categoryTags?: string[];
  aliases?: string[];
  description: string;
  mainReasonToTrack?: string;
  usefulMetrics?: string[];
  sideEffectsToMonitor?: string[];
  evidenceLevel?: string;
  storageNotes?: string;
  cautionNotes?: string;
  doseUnit: DoseUnit;
  defaultDose: string;
  notes: string;
  isCustom: boolean;
}

export interface Schedule {
  id: string;
  daysOfWeek: number[];
  timesPerDay: number;
  preferredTimes: string[];
  notificationEnabled: boolean;
  frequencyType?: FrequencyType;
  intervalEvery?: number;
}

export interface VialTracking {
  enabled: boolean;
  label: string;
  totalAmount: string;
  unit: "mg" | "mcg" | "IU";
  reconstitutionVolume: string;
  volumeUnit: "mL";
  startingSupply: string;
  remainingSupply: string;
  lowSupplyThreshold: string;
}

export interface CyclingRule {
  enabled: boolean;
  activeLength: number;
  offLength: number;
  unit: CycleUnit;
  repeat: boolean;
  cycleStartDate: string;
}

export interface TitrationPhase {
  id: string;
  name: string;
  amount: string;
  unit: "mcg" | "mg" | "IU";
  frequency: FrequencyType;
  duration: number;
  durationUnit: DurationUnit;
  startDate?: string;
  notes?: string;
}

export interface ProtocolItem {
  id: string;
  peptideId: string;
  schedule: Schedule;
  doseAmount: string;
  doseUnit?: DoseUnit;
  instructions?: string;
  method?: DoseMethod;
  notes?: string;
  doseType?: DoseType;
  titrationPhases?: TitrationPhase[];
  vialTracking?: VialTracking;
  cycling?: CyclingRule;
  syringeUnitsEnabled?: boolean;
}

export interface Protocol {
  id: string;
  name: string;
  cycleStartDate: string;
  cycleEndDate: string;
  noEndDate?: boolean;
  items: ProtocolItem[];
  paused: boolean;
  completed: boolean;
}

export interface ScheduledDose {
  id: string;
  protocolId: string;
  protocolItemId: string;
  peptideId: string;
  scheduledAt: string;
  doseAmount: string;
  doseUnit: DoseUnit;
  instructions?: string;
  method?: DoseMethod;
  phaseName?: string;
}

export interface DoseLog {
  id: string;
  scheduledDoseId: string;
  status: DoseStatus;
  loggedAt: string;
  takenAt?: string;
  takenLate: boolean;
  notes: string;
  peptideId?: string;
  amount?: string;
  unit?: DoseUnit;
  method?: DoseMethod;
  injectionSite?: string;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

export interface BodyMetricEntry {
  id: string;
  date: string;
  weight?: string;
  sleepQuality?: number;
  energy?: number;
  painLevel?: number;
  notes?: string;
}

export interface MetricConfig {
  id: string;
  name: string;
  category: MetricCategory;
  unit?: string;
  inputType: MetricInputType;
  frequency: MetricFrequency;
  goalDirection: GoalDirection;
  enabled: boolean;
  showOnDashboard: boolean;
  showInAnalytics: boolean;
  quickEntry: boolean;
  favorite?: boolean;
  order?: number;
}

export interface MetricEntry {
  id: string;
  metricId: string;
  date: string;
  value: string | number | boolean;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  type: "journal" | "dose" | "protocol" | "metric" | "photo" | "side-effect" | "milestone";
  title: string;
  body: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  angle: "front" | "side" | "back";
  label: string;
  dataUrl?: string;
  notes?: string;
}

export interface PrivacySettings {
  passcodeEnabled: boolean;
  faceIdPlaceholderEnabled: boolean;
  privacyMessageAccepted: boolean;
}

export interface InventoryItem {
  id: string;
  peptideId: string;
  vialQuantity: number;
  vialAmountMg: number;
  bacWaterMl: number;
  remainingVolumeMl: number;
  expirationDate: string;
  lotNumber: string;
  supplier: string;
  costPerVial: number;
  monthlySpend: number;
  lowSupplyThresholdDoses: number;
}

export interface ProtocolTemplate {
  id: string;
  name: string;
  goal: string;
  preselectedMetricIds: string[];
  reminderTimes: string[];
  notes: string;
}

export interface LabResult {
  id: string;
  name: string;
  date: string;
  value: number;
  unit: string;
  targetRange: string;
}

export interface RecoveryEntry {
  id: string;
  date: string;
  injuryType: string;
  painLocation: string;
  bodyArea: string;
  recoveryPercent: number;
  mobility: number;
  soreness: number;
  reinjuryEvent: boolean;
  notes?: string;
}

export interface InjectionSite {
  id: string;
  name: string;
  region: "abdomen" | "thigh" | "arm" | "glute" | "other";
  lastUsedAt?: string;
  notes?: string;
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  visible: boolean;
  size: "small" | "medium" | "large";
  pinned: boolean;
  order: number;
}

export interface SmartBuilderPrefs {
  primaryGoal: string;
  secondaryGoals: string[];
  injectionTimes: string[];
  sleepSchedule: string;
  workSchedule: string;
  trainingDays: string[];
  trackingIntensity: "Minimal" | "Standard" | "Advanced";
}

export interface AppState {
  user: UserProfile;
  peptides: Peptide[];
  protocols: Protocol[];
  doseLogs: DoseLog[];
  bodyMetrics: BodyMetricEntry[];
  metricConfigs: MetricConfig[];
  metricEntries: MetricEntry[];
  journalEntries: JournalEntry[];
  progressPhotos: ProgressPhoto[];
  inventoryItems: InventoryItem[];
  protocolTemplates: ProtocolTemplate[];
  labResults: LabResult[];
  recoveryEntries: RecoveryEntry[];
  injectionSites?: InjectionSite[];
  dashboardWidgets: DashboardWidget[];
  smartBuilder: SmartBuilderPrefs;
  onboardingComplete: boolean;
  privacySettings: PrivacySettings;
}
