import { connectDB } from "../lib/mongodb.js";
import { Application } from "../lib/models.js";
import { sendApplicationConfirmation } from "../lib/mailer.js";

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

  const appliedAt = new Date().toISOString();

  // Simulate applying to each job (90% success)
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
  const summary = { total: jobs.length, successful, failed };

  // Save to MongoDB + send email — both non-blocking
  let applicationRecordId = null;
  let emailStatus = null;

  await Promise.allSettled([
    // Save to DB
    connectDB()
      .then(() =>
        Application.create({
          sessionId: sessionId || "anonymous",
          resumeId: resumeId || null,
          applicantName: applicantName || "Unknown",
          applicantEmail: applicantEmail || "",
          jobs: results,
          summary,
        })
      )
      .then((record) => {
        applicationRecordId = record._id;
      })
      .catch((err) => console.error("DB save failed:", err.message)),

    // Send confirmation email
    sendApplicationConfirmation({
      applicantName,
      applicantEmail,
      results,
      summary,
      appliedAt,
    })
      .then((status) => {
        emailStatus = status;
      })
      .catch((err) => {
        console.error("Email send failed:", err.message);
        emailStatus = { sent: false, reason: err.message };
      }),
  ]);

  res.status(200).json({
    success: true,
    applicationRecordId,
    emailConfirmation: emailStatus,
    summary,
    results,
    appliedAt,
  });
}
