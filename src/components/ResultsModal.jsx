export default function ResultsModal({ results, onClose, onReset }) {
  const { summary, results: items = [], appliedAt, emailConfirmation } = results;
  const emailSent = emailConfirmation?.sent === true;
  const emailTo = emailConfirmation?.to;

  return (
    <div className="results-overlay" onClick={onClose}>
      <div className="results-modal" onClick={(e) => e.stopPropagation()}>

        <div className="results-header">
          <span className="results-icon">{summary.successful > 0 ? "🎉" : "⚠️"}</span>
          <h2 style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
            {summary.successful > 0 ? "Applications Submitted!" : "Submission Complete"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {new Date(appliedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
          </p>
        </div>

        {/* Stats */}
        <div className="results-stats">
          <div className="stat-box total">
            <span className="stat-number">{summary.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-box success">
            <span className="stat-number">{summary.successful}</span>
            <span className="stat-label">Applied ✓</span>
          </div>
          {summary.failed > 0 && (
            <div className="stat-box failed">
              <span className="stat-number">{summary.failed}</span>
              <span className="stat-label">Failed</span>
            </div>
          )}
        </div>

        {/* Email confirmation banner */}
        <div
          style={{
            background: emailSent
              ? "rgba(16,185,129,0.1)"
              : "rgba(245,158,11,0.08)",
            border: `1px solid ${emailSent ? "rgba(16,185,129,0.35)" : "rgba(245,158,11,0.3)"}`,
            borderRadius: "10px",
            padding: "0.85rem 1.1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>{emailSent ? "📧" : "⚠️"}</span>
          <div>
            {emailSent ? (
              <>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--success)" }}>
                  Confirmation email sent!
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  Check your inbox at <strong style={{ color: "white" }}>{emailTo}</strong> — full job list with application IDs inside
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--warning)" }}>
                  Email not sent
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                  {emailConfirmation?.reason || "Gmail credentials not configured in environment variables"}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Job results list */}
        <div style={{ maxHeight: "260px", overflowY: "auto", marginBottom: "1.5rem" }}>
          {items.map((item) => (
            <div
              key={item.jobId}
              className={`result-item ${item.status === "applied" ? "applied" : "failed-item"}`}
            >
              <span style={{ fontSize: "1rem" }}>{item.status === "applied" ? "✅" : "❌"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {item.company}
                  {item.applicationId && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        color: "var(--success)",
                        fontFamily: "monospace",
                        fontSize: "0.72rem",
                      }}
                    >
                      #{item.applicationId}
                    </span>
                  )}
                </div>
              </div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--primary)",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  View ↗
                </a>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-outline-custom" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>
            Close
          </button>
          <button className="btn-primary-custom" onClick={onReset} style={{ flex: 1, justifyContent: "center" }}>
            🔍 New Search
          </button>
        </div>

        {results.applicationRecordId && (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.72rem",
              color: "#475569",
              marginTop: "1rem",
              marginBottom: 0,
            }}
          >
            Saved to MongoDB · Record: {String(results.applicationRecordId).substring(0, 16)}…
          </p>
        )}
      </div>
    </div>
  );
}
