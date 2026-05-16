import { DoseLog } from "../types";
import { localDateKey } from "../lib/dates";

export function Heatmap({ logs }: { logs: DoseLog[] }) {
  const today = new Date();
  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (34 - index));
    const key = localDateKey(date);
    const count = logs.filter((log) => localDateKey(new Date(log.loggedAt)) === key && log.status === "taken").length;
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
