import mongoose from "mongoose";

// ─── Resume ───────────────────────────────────────────────
const resumeSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    name: String,
    email: String,
    phone: String,
    location: String,
    title: String,
    yearsOfExperience: Number,
    skills: [String],
    experience: [
      {
        company: String,
        role: String,
        duration: String,
        description: String,
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        year: String,
      },
    ],
    summary: String,
    rawTextSnippet: String,
  },
  { timestamps: true }
);

// ─── Job Application ──────────────────────────────────────
const applicationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
    applicantName: String,
    applicantEmail: String,
    jobs: [
      {
        jobId: String,
        title: String,
        company: String,
        location: String,
        url: String,
        matchScore: Number,
        status: { type: String, enum: ["applied", "failed", "pending"], default: "pending" },
        applicationId: String,
        appliedAt: Date,
        message: String,
      },
    ],
    summary: {
      total: Number,
      successful: Number,
      failed: Number,
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);
export const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);
