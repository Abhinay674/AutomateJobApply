export default function ResumeProfile({ data }) {
  if (!data) return null;
  const initials = (data.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="profile-card">
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="profile-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{data.name || "Candidate"}</div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {data.title || "Professional"}
            {data.location ? ` · 📍 ${data.location}` : ""}
            {data.yearsOfExperience ? ` · ${data.yearsOfExperience} yrs exp` : ""}
          </div>
          {data.email && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.15rem" }}>
              ✉ {data.email}
            </div>
          )}
        </div>
        <div
          style={{
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "var(--success)",
            padding: "0.4rem 0.9rem",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          ✅ Resume Parsed
        </div>
      </div>

      {data.summary && (
        <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1rem" }}>
          {data.summary}
        </p>
      )}

      {data.skills?.length > 0 && (
        <div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Skills Detected
          </div>
          <div>
            {data.skills.slice(0, 18).map((s) => (
              <span key={s} className="skill-badge">{s}</span>
            ))}
            {data.skills.length > 18 && (
              <span className="skill-badge">+{data.skills.length - 18} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
