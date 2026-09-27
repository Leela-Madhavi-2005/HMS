import { useEffect, useState } from "react";

export default function StatCard({ icon, title, value, loading, gradient }) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated counter effect
  useEffect(() => {
    if (loading || value === undefined) return;

    const target = Number(value);
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setDisplayValue(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(target);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, loading]);

  const formatValue = (val) => {
    if (typeof val === "number" && val >= 1000) {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`stat-card ${gradient || "gradient-1"}`}>
      {loading ? (
        <div className="stat-card-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-text-sm"></div>
          <div className="skeleton-text-lg"></div>
        </div>
      ) : (
        <>
          <div className="stat-card-icon">{icon}</div>
          <p className="stat-card-title">{title}</p>
          <h2 className="stat-card-value">{formatValue(displayValue)}</h2>
        </>
      )}
    </div>
  );
}
