import { useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ResumeUpload from "./components/ResumeUpload";
import LoadingScreen from "./components/LoadingScreen";
import ResumeProfile from "./components/ResumeProfile";
import JobList from "./components/JobList";
import ResultsModal from "./components/ResultsModal";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "";

const STAGES = { UPLOAD: "upload", LOADING: "loading", JOBS: "jobs" };

export default function App() {
  const [stage, setStage] = useState(STAGES.UPLOAD);
  const [loadingStep, setLoadingStep] = useState(1);
  const [resumeData, setResumeData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [applying, setApplying] = useState(false);
  const [results, setResults] = useState(null);

  const handleUpload = useCallback(async (file) => {
    if (!file) return toast.error("Please select a resume file first");

    setStage(STAGES.LOADING);
    setLoadingStep(1);

    try {
      // Step 1-2: Parse resume
      setLoadingStep(2);
      const formData = new FormData();
      formData.append("resume", file);

      const parseRes = await axios.post(`${API}/api/parse-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data: parsed, sessionId: sid, resumeId: rid } = parseRes.data;
      setResumeData(parsed);
      setSessionId(sid);
      setResumeId(rid);

      // Step 3-5: Search jobs
      setLoadingStep(3);
      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep(4);

      const jobRes = await axios.post(`${API}/api/search-jobs`, { resumeData: parsed });

      setLoadingStep(5);
      await new Promise((r) => setTimeout(r, 300));

      setJobs(jobRes.data.jobs || []);
      setSelectedIds(new Set((jobRes.data.jobs || []).map((j) => j.id)));
      setStage(STAGES.JOBS);
      toast.success(`Found ${jobRes.data.total} matching opportunities!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Something went wrong. Please try again.");
      setStage(STAGES.UPLOAD);
    }
  }, []);

  const handleReset = () => {
    setStage(STAGES.UPLOAD);
    setResumeData(null);
    setJobs([]);
    setSelectedIds(new Set());
    setResults(null);
    setLoadingStep(1);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visible = filteredJobs.map((j) => j.id);
    const allSelected = visible.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visible.forEach((id) => next.delete(id));
      else visible.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleApply = async () => {
    const toApply = jobs.filter((j) => selectedIds.has(j.id));
    if (!toApply.length) return toast.warning("Please select at least one job");

    setApplying(true);
    try {
      const res = await axios.post(`${API}/api/apply-jobs`, {
        jobs: toApply,
        sessionId,
        resumeId,
        applicantName: resumeData?.name,
        applicantEmail: resumeData?.email,
      });
      setResults(res.data);
      toast.success(`Applied to ${res.data.summary.successful} jobs!`);
    } catch (err) {
      toast.error("Failed to submit applications. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (filter === "all") return true;
    if (filter === "high") return j.matchScore >= 80;
    if (filter === "medium") return j.matchScore >= 60 && j.matchScore < 80;
    if (filter === "remote") return j.location?.toLowerCase().includes("remote");
    return true;
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar onReset={stage === STAGES.JOBS ? handleReset : null} />

      {stage === STAGES.UPLOAD && (
        <>
          <HeroSection />
          <ResumeUpload onUpload={handleUpload} isLoading={false} />
        </>
      )}

      {stage === STAGES.LOADING && <LoadingScreen currentStep={loadingStep} />}

      {stage === STAGES.JOBS && (
        <div className="container" style={{ maxWidth: "900px", padding: "2rem 1rem" }}>
          <ResumeProfile data={resumeData} />
          <JobList
            jobs={filteredJobs}
            allJobs={jobs}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onApply={handleApply}
            applying={applying}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
      )}

      {results && (
        <ResultsModal
          results={results}
          onClose={() => setResults(null)}
          onReset={handleReset}
        />
      )}

      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme="dark"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
}
