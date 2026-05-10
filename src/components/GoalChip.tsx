import { Goal } from "../types";

export function GoalChip({ goal, active = true }: { goal: Goal; active?: boolean }) {
  return <span className={`goal-chip ${active ? "active" : ""}`}>{goal}</span>;
}
