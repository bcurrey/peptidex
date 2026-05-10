# PeptideX

PeptideX is a mobile-first, local-first peptide/protocol tracker built as a responsive React + TypeScript PWA. It is for tracking and logging only. It does not provide medical advice, dosing recommendations, or health claims; dosage fields are treated as user-entered notes.

## Run Locally

```bash
npm install
npm run dev
```

Then open the Vite local URL shown in your terminal.

## iPhone Home Screen Install

1. Open the app URL in Safari on iPhone.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch PeptideX from the new home screen icon.

The app includes a web manifest, iPhone safe-area spacing, standalone display metadata, and a basic service worker cache.

## Current Features

- Home dashboard with daily protocol score, streak, weekly completion, daily plan, scheduled dose cards, and sticky next-dose bar.
- Peptide library with search, categories, custom peptide/pill creation, editable detail fields, dose unit selector, notes, and safety disclaimer.
- Protocol creation/editing with start/end dates, multiple protocol items, per-item schedules, preferred times, dose notes, instructions, notification toggles, pause, and complete status.
- Dose logging for taken, skipped, missed, and snoozed statuses with timestamp storage, taken-late detection, streaks, and compliance calculations.
- Analytics with summary cards, weekly chart, heatmap, compliance by peptide, missed-dose windows, insight card, and HealthKit placeholder.
- Profile with name, member since, counts, achievements, goals, body metrics, and reminder/native notification placeholder.
- Configurable Metrics & Insights hub with enabled-only tracking modules, Quick Check-In, Full Check-In, Custom Log Entry, trend cards, rule-based correlations, journal timeline, progress photo placeholders, exports, privacy controls, and locked Pro placeholders.
- Premium visualization system with reusable chart cards, time ranges, overlays, moving averages, calendar view, score cards, radar-style wellness placeholder, and export flow.
- Responsive mobile/web layout: iPhone keeps bottom tab navigation, while desktop expands into a wider web canvas with a left navigation rail and wrapped filter controls.
- Inventory/supply tracking with vial details, reconstitution math, low-supply warnings, concentration, estimated remaining doses, refill date, supplier, lot, and spend fields.
- Smart Protocol Builder and editable starter templates for recovery, fat loss, sleep, cognitive, longevity, fitness, and wellness.
- Protocol comparison, change detection, motivation/milestone cards, smart timeline filters, lab result tracking, recovery/body-map placeholder, customizable dashboard widgets, and future iOS widget placeholders.

## Configurable Tracking

PeptideX does not require every user to track every metric. Users can enable or disable modules such as weight, body measurements, mood, energy, sleep, skin, pain/recovery, side effects, libido, workouts, photos, labs, or custom metrics. Daily check-ins only show enabled modules.

Each metric can be renamed and configured with an input type, tracking frequency, goal direction, dashboard visibility, analytics visibility, and quick-entry visibility. If a metric does not have enough logs, analytics displays an insufficient-data message instead of inventing a trend.

## Insights, Journal, Photos, Export, Privacy, Pro

- Rule-based insight cards are included as placeholders for future AI analysis.
- Wellness score engine combines adherence, sleep, mood, recovery, and activity into daily, weekly, recovery, and consistency scores.
- Journal timeline supports freeform entries alongside protocol, metric, photo, dose, side-effect, and milestone event types.
- Progress photo placeholders support front, side, and back photo architecture with local-first storage.
- Export supports JSON, CSV, and browser print/save-to-PDF summary flow.
- Privacy controls are local-first with passcode and FaceID placeholders for a future native iOS build.
- Pro section is locked as a placeholder for advanced analytics, health integrations, AI insights, cloud backup, and advanced exports. Payments are not implemented.

## Future Expo iOS Plan

- Move screens/components into an Expo Router app.
- Replace the browser notification placeholder with `expo-notifications`.
- Store per-dose notification IDs for scheduling, updates, and cancellation.
- Add iOS permission onboarding and background-safe reminder logic.
- Add HealthKit through a native module or Expo config plugin once the app needs native biometrics.

## Future Supabase Login/Sync Plan

- Keep the current `AppState` types as the API contract.
- Replace `src/lib/storage.ts` with a repository layer that reads/writes to Supabase tables.
- Suggested tables: `profiles`, `peptides`, `protocols`, `protocol_items`, `schedules`, `scheduled_doses`, `dose_logs`, `body_metrics`.
- Add auth with row-level security so each user can only access their own data.
- Keep localStorage or IndexedDB as an offline cache, then reconcile with Supabase on reconnect.
