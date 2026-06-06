export default function Navbar({ onReset }) {
  return (
    <nav className="navbar-custom" style={{ position: "sticky", top: 0, zIndex: 200 }}>
      <div
        className="container-fluid d-flex align-items-center justify-content-between"
        style={{ maxWidth: "1100px", margin: "0 auto" }}
      >
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "1.8rem" }}>🚀</span>
          <span className="navbar-brand-text">JobApplyAI</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span
            style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--success)",
                display: "inline-block",
              }}
            />
            Powered by GPT-4o
          </span>
          {onReset && (
            <button
              className="btn-outline-custom"
              onClick={onReset}
              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
            >
              ↺ New Search
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
