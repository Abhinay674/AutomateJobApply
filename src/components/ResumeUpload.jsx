import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const fmt = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const fileIcon = (name = "") =>
  name.endsWith(".pdf") ? "📄" : name.endsWith(".docx") ? "📝" : "📃";

export default function ResumeUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: loading,
  });

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    await onUpload(file);
    setLoading(false);
  };

  return (
    <div className="upload-container">
      <div {...getRootProps()} className={`dropzone${isDragActive ? " active" : ""}`}>
        <input {...getInputProps()} />
        {file ? (
          <>
            <span className="dropzone-icon">✅</span>
            <p className="dropzone-title">Resume Loaded!</p>
            <p className="dropzone-subtitle">Drop another file to replace it</p>
          </>
        ) : (
          <>
            <span className="dropzone-icon">{isDragActive ? "📂" : "📋"}</span>
            <p className="dropzone-title">
              {isDragActive ? "Drop your resume here" : "Upload Your Resume"}
            </p>
            <p className="dropzone-subtitle">
              Drag & drop, or click to browse your files
            </p>
            <div className="file-types">
              {["PDF", "DOCX", "TXT"].map((t) => (
                <span key={t} className="file-type-badge">{t}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {file && (
        <div className="file-selected">
          <span className="file-icon">{fileIcon(file.name)}</span>
          <div style={{ flex: 1 }}>
            <div className="file-name">{file.name}</div>
            <div className="file-size">{fmt(file.size)}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (!loading) setFile(null); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: "0.25rem 0.5rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="text-center mt-4">
        <button
          className="btn-primary-custom"
          onClick={handleSubmit}
          disabled={!file || loading}
          style={{ minWidth: "230px", justifyContent: "center" }}
        >
          {loading ? (
            <>
              <span className="loading-spinner-sm" />
              Analyzing Resume...
            </>
          ) : (
            "🔍  Analyze & Find Jobs"
          )}
        </button>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
          🔒 Your resume is processed securely and never stored permanently
        </p>
      </div>
    </div>
  );
}
