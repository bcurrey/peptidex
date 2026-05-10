export function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 120 120" className="ring">
        <circle cx="60" cy="60" r={radius} className="ring-track" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="ring-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-center">
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
