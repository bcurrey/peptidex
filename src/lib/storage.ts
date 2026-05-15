import { AppState } from "../types";
import { seedHistoricalLogs, seedState } from "../data/seed";

const STORAGE_KEY = "peptidex-state-v1";

export const createSeedState = (): AppState => ({
  ...seedState,
  doseLogs: seedHistoricalLogs(),
});

const normalizeState = (state: Partial<AppState>): AppState => {
  const seeded = createSeedState();
  const peptideIds = new Set((state.peptides || []).map((peptide) => peptide.id));
  const mergedPeptides = [
    ...(state.peptides || []),
    ...seeded.peptides.filter((peptide) => !peptideIds.has(peptide.id)),
  ];
  const metricIds = new Set((state.metricConfigs || []).map((metric) => metric.id));
  const normalizeProtocolItem = (item: any) => ({
    ...item,
    method: item.method || "SubQ",
    doseType: item.doseType || "Fixed Dose",
    titrationPhases: item.titrationPhases || [],
    vialTracking: item.vialTracking || {
      enabled: false,
      label: "",
      totalAmount: "",
      unit: "mg",
      reconstitutionVolume: "",
      volumeUnit: "mL",
      startingSupply: "",
      remainingSupply: "",
      lowSupplyThreshold: "",
    },
    cycling: item.cycling || {
      enabled: false,
      activeLength: 5,
      offLength: 2,
      unit: "days",
      repeat: true,
      cycleStartDate: new Date().toISOString().slice(0, 10),
    },
  });

  return {
    ...seeded,
    ...state,
    user: state.user || seeded.user,
    peptides: mergedPeptides,
    protocols: (state.protocols || seeded.protocols).map((protocol) => ({
      ...protocol,
      noEndDate: protocol.noEndDate ?? false,
      items: protocol.items.map(normalizeProtocolItem),
    })),
    doseLogs: state.doseLogs || seeded.doseLogs,
    bodyMetrics: state.bodyMetrics || seeded.bodyMetrics,
    metricConfigs: [
      ...(state.metricConfigs || []),
      ...seeded.metricConfigs.filter((metric) => !metricIds.has(metric.id)),
    ].map((metric, index) => ({ ...metric, favorite: metric.favorite ?? metric.quickEntry, order: metric.order ?? index })),
    metricEntries: state.metricEntries || seeded.metricEntries,
    journalEntries: state.journalEntries || seeded.journalEntries,
    progressPhotos: state.progressPhotos || seeded.progressPhotos,
    inventoryItems: state.inventoryItems || seeded.inventoryItems,
    protocolTemplates: state.protocolTemplates || seeded.protocolTemplates,
    labResults: state.labResults || seeded.labResults,
    recoveryEntries: state.recoveryEntries || seeded.recoveryEntries,
    injectionSites: state.injectionSites || seeded.injectionSites,
    dashboardWidgets: state.dashboardWidgets || seeded.dashboardWidgets,
    smartBuilder: state.smartBuilder || seeded.smartBuilder,
    onboardingComplete: state.onboardingComplete ?? seeded.onboardingComplete,
    privacySettings: state.privacySettings || seeded.privacySettings,
  };
};

export const loadState = (): AppState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createSeedState();
  try {
    return normalizeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return createSeedState();
  }
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetState = () => {
  const state = createSeedState();
  saveState(state);
  return state;
};
