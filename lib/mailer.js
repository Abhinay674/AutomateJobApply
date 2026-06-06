import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

function jobRowHtml(job) {
  const statusColor = job.status === "applied" ? "#10b981" : "#ef4444";
  const statusIcon = job.status === "applied" ? "✅" : "❌";
  const matchColor =
    job.matchScore >= 80 ? "#10b981" : job.matchScore >= 60 ? "#f59e0b" : "#94a3b8";

  return `
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:14px 12px;">
        <div style="font-weight:600;color:#f1f5f9;font-size:14px;">${job.title}</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:3px;">${job.company}</div>
      </td>
      <td style="padding:14px 12px;color:#94a3b8;font-size:13px;">📍 ${job.location || "—"}</td>
      <td style="padding:14px 12px;">
        <span style="background:${matchColor}20;color:${matchColor};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid ${matchColor}40;">
          ${job.matchScore || "—"}% match
        </span>
      </td>
      <td style="padding:14px 12px;">
        <span style="color:${statusColor};font-size:13px;font-weight:600;">${statusIcon} ${job.status === "applied" ? "Applied" : "Failed"}</span>
        ${job.applicationId ? `<div style="color:#6366f1;font-size:11px;font-family:monospace;margin-top:3px;">${job.applicationId}</div>` : ""}
      </td>
      <td style="padding:14px 12px;">
        ${job.url ? `<a href="${job.url}" style="color:#6366f1;font-size:12px;text-decoration:none;">View Job ↗</a>` : "—"}
      </td>
    </tr>`;
}

export async function sendApplicationConfirmation({
  applicantName,
  applicantEmail,
  results,
  summary,
  appliedAt,
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log("Email not configured — skipping confirmation email");
    return { sent: false, reason: "Email credentials not configured" };
  }

  const toEmail = applicantEmail || process.env.EMAIL_USER;
  const name = applicantName || "there";
  const date = new Date(appliedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });

  const appliedJobs = results.filter((r) => r.status === "applied");
  const failedJobs = results.filter((r) => r.status !== "applied");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <div style="max-width:680px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">🚀</div>
      <h1 style="margin:0;font-size:28px;font-weight:800;background:linear-gradient(135deg,#6366f1,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
        JobApplyAI
      </h1>
      <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Application Confirmation</p>
    </div>

    <!-- Hero Card -->
    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(6,182,212,0.1));border:1px solid rgba(99,102,241,0.3);border-radius:16px;padding:28px;margin-bottom:24px;text-align:center;">
      <p style="color:#94a3b8;margin:0 0 8px;font-size:14px;">Hey ${name},</p>
      <h2 style="color:#f1f5f9;margin:0 0 8px;font-size:22px;font-weight:700;">
        🎉 You applied to <span style="color:#6366f1;">${summary.successful}</span> job${summary.successful !== 1 ? "s" : ""}!
      </h2>
      <p style="color:#94a3b8;margin:0;font-size:13px;">${date} IST</p>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#6366f1;">${summary.total}</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Total Selected</div>
      </div>
      <div style="flex:1;background:#1e293b;border:1px solid rgba(16,185,129,0.3);border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#10b981;">${summary.successful}</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Successfully Applied</div>
      </div>
      ${summary.failed > 0 ? `
      <div style="flex:1;background:#1e293b;border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#ef4444;">${summary.failed}</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Failed</div>
      </div>` : ""}
    </div>

    <!-- Applied Jobs Table -->
    ${appliedJobs.length > 0 ? `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid #334155;background:rgba(16,185,129,0.08);">
        <h3 style="margin:0;color:#10b981;font-size:15px;font-weight:700;">✅ Successfully Applied (${appliedJobs.length})</h3>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:rgba(255,255,255,0.03);">
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Job / Company</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Location</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Match</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Status / ID</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Link</th>
          </tr>
        </thead>
        <tbody>
          ${appliedJobs.map(jobRowHtml).join("")}
        </tbody>
      </table>
    </div>` : ""}

    <!-- Failed Jobs (if any) -->
    ${failedJobs.length > 0 ? `
    <div style="background:#1e293b;border:1px solid rgba(239,68,68,0.2);border-radius:16px;overflow:hidden;margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid rgba(239,68,68,0.2);background:rgba(239,68,68,0.05);">
        <h3 style="margin:0;color:#ef4444;font-size:15px;font-weight:700;">❌ Failed (${failedJobs.length}) — You can retry these manually</h3>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${failedJobs.map(jobRowHtml).join("")}</tbody>
      </table>
    </div>` : ""}

    <!-- Next Steps -->
    <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;color:#f1f5f9;font-size:15px;font-weight:700;">💡 What to do next</h3>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${[
          ["📧", "Check your email/spam for individual confirmation emails from each company"],
          ["🔔", "Update your LinkedIn to signal you're open to work"],
          ["📝", "Prepare for interviews — brush up on React hooks, Redux, and system design"],
          ["📞", "Follow up on applications after 5–7 business days"],
        ].map(([icon, text]) => `
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:18px;flex-shrink:0;">${icon}</span>
            <span style="color:#94a3b8;font-size:13px;line-height:1.5;">${text}</span>
          </div>`).join("")}
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;border-top:1px solid #1e293b;">
      <p style="color:#475569;font-size:12px;margin:0;">
        Sent by <strong style="color:#6366f1;">JobApplyAI</strong> · Powered by GPT-4o
      </p>
      <p style="color:#334155;font-size:11px;margin:6px 0 0;">
        This is an automated confirmation of your job applications submitted via JobApplyAI.
      </p>
    </div>

  </div>
</body>
</html>`;

  const transport = createTransport();

  await transport.sendMail({
    from: `"JobApplyAI 🚀" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `✅ You applied to ${summary.successful} jobs — JobApplyAI Confirmation`,
    html,
    text: `Hi ${name},\n\nYou applied to ${summary.successful} job(s) on ${date}.\n\n${appliedJobs.map((j) => `• ${j.title} at ${j.company} [${j.applicationId || "N/A"}]`).join("\n")}\n\nJobApplyAI`,
  });

  return { sent: true, to: toEmail };
}
