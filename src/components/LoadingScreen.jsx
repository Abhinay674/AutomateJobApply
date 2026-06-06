import { useEffect, useState } from "react";

const STEPS = [
  { id: 1, icon: "📄", label: "Reading your resume..." },
  { id: 2, icon: "🧠", label: "Extracting skills & experience..." },
  { id: 3, icon: "🔍", label: "Searching job boards..." },
  { id: 4, icon: "🎯", label: "Matching opportunities with AI..." },
  { id: 5, icon: "✨", label: "Ranking by compatibility..." },
];

export default function LoadingScreen({ currentStep }) {
  const [active, setActive] = useState(currentStep || 1);

  useEffect(() => setActive(currentStep || 1), [currentStep]);

  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1.5rem" }}>
        Finding Your Perfect Jobs
      </h3>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.9rem" }}>
        AI is analyzing your resume and scanning thousands of opportunities
      </p>
      <div className="loading-steps">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`loading-step ${s.id < active ? "done" : s.id === active ? "active" : "pending"}`}
          >
            <span style={{ fontSize: "1rem" }}>
              {s.id < active ? "✅" : s.id === active ? "⏳" : "○"}
            </span>
            <span style={{ fontSize: "0.88rem" }}>
              {s.icon} {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
