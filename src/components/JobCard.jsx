function scoreClass(score) {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

export default function JobCard({ job, selected, onToggle }) {
  const logo = job.logo;
  const initial = (job.company || "?")[0].toUpperCase();
  const score = job.matchScore ?? 0;

  return (
    <div className={`job-card${selected ? " selected" : ""}`} onClick={() => onToggle(job.id)}>
      <input
        type="checkbox"
        className="job-card-checkbox"
        checked={selected}
        onChange={() => onToggle(job.id)}
        onClick={(e) => e.stopPropagation()}
      />

      <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
        <div className="company-logo">
          {logo ? <img src={logo} alt={job.company} onError={(e) => (e.target.style.display = "none")} /> : initial}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="job-title" style={{ paddingRight: "2rem" }}>{job.title}</div>
          <div className="company-name">{job.company}</div>

          <div className="job-meta">
            <span className="job-meta-item">📍 {job.location}</span>
            <span className="job-meta-item">💼 {job.type || "Full-time"}</span>
            {job.salary && <span className="job-meta-item">💰 {job.salary}</span>}
            {job.source && (
              <span
                className="job-meta-item"
                style={{
                  color: job.source === "AI Matched" ? "#a5b4fc" : "#67e8f9",
                  background: job.source === "AI Matched" ? "rgba(99,102,241,0.1)" : "rgba(6,182,212,0.1)",
                }}
              >
                {job.source === "AI Matched" ? "✨" : "🌐"} {job.source}
              </span>
            )}
          </div>

          {job.description && (
            <p className="job-description">{job.description}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              <span className={`match-score ${scoreClass(score)}`}>
                {score >= 80 ? "🔥" : score >= 55 ? "⚡" : "📌"} {score}% match
              </span>
              {job.matchReasons?.slice(0, 2).map((r) => (
                <span
                  key={r}
                  style={{
                    fontSize: "0.73rem",
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.04)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "5px",
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: "0.78rem",
                color: "var(--primary)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              View Job ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
