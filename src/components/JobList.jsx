import JobCard from "./JobCard";

const FILTERS = [
  { key: "all", label: "All Jobs" },
  { key: "india", label: "🇮🇳 India Jobs" },
  { key: "high", label: "🔥 Best Match (80%+)" },
  { key: "medium", label: "⚡ Good Match (60%+)" },
  { key: "remote", label: "🌍 Remote" },
];

export default function JobList({
  jobs,
  allJobs,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onApply,
  applying,
  filter,
  onFilterChange,
}) {
  const allVisible = jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id));
  const someVisible = jobs.some((j) => selectedIds.has(j.id));
  const selectedCount = jobs.filter((j) => selectedIds.has(j.id)).length;

  return (
    <div>
      {/* Header */}
      <div className="jobs-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.15rem" }}>
            🎯 {allJobs.length} Matching Jobs Found
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "0.2rem" }}>
            Showing {jobs.length} jobs · {selectedIds.size} selected across all
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-btn${filter === f.key ? " active" : ""}`}
              onClick={() => onFilterChange(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select All + Apply Bar */}
      <div className="select-all-bar">
        <div className="select-all-left">
          <input
            type="checkbox"
            className="select-all-checkbox"
            checked={allVisible}
            ref={(el) => { if (el) el.indeterminate = !allVisible && someVisible; }}
            onChange={onToggleSelectAll}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>
              {allVisible ? "Deselect All" : "Select All"} visible jobs
            </div>
            <div className="selected-count">
              <strong>{selectedCount}</strong> of {jobs.length} selected
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {selectedCount > 0 && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                padding: "0.35rem 0.85rem",
                background: "rgba(99,102,241,0.1)",
                borderRadius: "20px",
                border: "1px solid rgba(99,102,241,0.25)",
              }}
            >
              <strong style={{ color: "white" }}>{selectedCount}</strong> job
              {selectedCount !== 1 ? "s" : ""} selected
            </div>
          )}
          <button
            className="btn-success-custom"
            onClick={onApply}
            disabled={applying || selectedCount === 0}
            style={{ minWidth: "160px", justifyContent: "center" }}
          >
            {applying ? (
              <>
                <span className="loading-spinner-sm" />
                Applying...
              </>
            ) : (
              `🚀 Apply to ${selectedCount} Job${selectedCount !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      </div>

      {/* Job Cards */}
      {jobs.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--text-muted)",
            background: "var(--dark-card)",
            borderRadius: "12px",
            border: "1px solid var(--dark-border)",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
          <div style={{ fontWeight: 600 }}>No jobs match this filter</div>
          <div style={{ fontSize: "0.875rem", marginTop: "0.4rem" }}>
            Try a different filter above
          </div>
        </div>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            selected={selectedIds.has(job.id)}
            onToggle={onToggleSelect}
          />
        ))
      )}
    </div>
  );
}
