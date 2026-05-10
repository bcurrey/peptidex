import { DoseLog } from "../types";

export function Heatmap({ logs }: { logs: DoseLog[] }) {
  const today = new Date();
  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (34 - index));
    const key = date.toISOString().slice(0, 10);
    const count = logs.filter((log) => log.loggedAt.startsWith(key) && log.status === "taken").length;
    return { key, count };
  });
  return (
    <div className="heatmap">
      {days.map((day) => (
        <span key={day.key} className={`heat-${Math.min(day.count, 3)}`} title={day.key} />
      ))}
    </div>
  );
}
