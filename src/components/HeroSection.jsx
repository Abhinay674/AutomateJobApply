export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="container">
        <h1 className="hero-title">
          Apply to Jobs <span className="gradient-text">10x Faster</span>
          <br />with AI
        </h1>
        <p className="hero-subtitle">
          Upload your resume once. Our AI reads your skills, experience, and location — then
          finds and applies to hundreds of matching jobs automatically.
        </p>

        <div className="steps-row">
          {[
            { n: "1", label: "Upload Resume" },
            { n: "2", label: "AI Analyzes Skills" },
            { n: "3", label: "Browse Matches" },
            { n: "4", label: "One-Click Apply" },
          ].map((s) => (
            <div className="step-item" key={s.n}>
              <span className="step-number">{s.n}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            marginTop: "2rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "🎯", stat: "95%", label: "Match Accuracy" },
            { icon: "⚡", stat: "< 2min", label: "Time to Apply" },
            { icon: "🏢", stat: "500+", label: "Job Sources" },
          ].map((s) => (
            <div
              key={s.stat}
              style={{
                textAlign: "center",
                padding: "1rem 1.5rem",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "12px",
                border: "1px solid var(--dark-border)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{s.icon}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>{s.stat}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
