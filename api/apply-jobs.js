import { connectDB } from "../lib/mongodb.js";
import { Application } from "../lib/models.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { jobs, sessionId, resumeId, applicantName, applicantEmail } = req.body || {};
  if (!jobs?.length) return res.status(400).json({ error: "No jobs provided" });

  // Simulate applying to each job (90% success rate)
  const results = jobs.map((job) => {
    const success = Math.random() > 0.1;
    return {
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      matchScore: job.matchScore,
      status: success ? "applied" : "failed",
      applicationId: success
        ? `APP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        : null,
      appliedAt: new Date(),
      message: success
        ? `Application submitted to ${job.company}`
        : "Application portal temporarily unavailable",
    };
  });

  const successful = results.filter((r) => r.status === "applied").length;
  const failed = results.filter((r) => r.status === "failed").length;

  // Save to MongoDB
  try {
    await connectDB();
    const record = await Application.create({
      sessionId: sessionId || "anonymous",
      resumeId: resumeId || null,
      applicantName: applicantName || "Unknown",
      applicantEmail: applicantEmail || "",
      jobs: results,
      summary: { total: jobs.length, successful, failed },
    });

    res.status(200).json({
      success: true,
      applicationRecordId: record._id,
      summary: { total: jobs.length, successful, failed },
      results,
      appliedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("apply-jobs db error:", err);
    // Still return results even if DB save fails
    res.status(200).json({
      success: true,
      summary: { total: jobs.length, successful, failed },
      results,
      appliedAt: new Date().toISOString(),
    });
  }
}
