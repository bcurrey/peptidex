import { Award } from "lucide-react";

export function AchievementBadge({ label, unlocked }: { label: string; unlocked: boolean }) {
  return (
    <div className={`achievement ${unlocked ? "unlocked" : ""}`}>
      <Award size={18} />
      <span>{label}</span>
    </div>
  );
}
