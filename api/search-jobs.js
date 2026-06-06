import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function fetchRemotiveJobs(query) {
  try {
    const r = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=20`
    );
    if (!r.ok) return [];
    const data = await r.json();
    return (data.jobs || []).slice(0, 15).map((j) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remote",
      type: j.job_type || "Full-time",
      salary: j.salary || "Competitive",
      description: (j.description || "").replace(/<[^>]*>/g, "").substring(0, 400),
      skills: j.tags || [],
      url: j.url,
      logo: j.company_logo || null,
      postedAt: j.publication_date,
      source: "Remotive",
      matchScore: null,
      matchReasons: [],
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { resumeData } = req.body || {};
  if (!resumeData) return res.status(400).json({ error: "No resume data provided" });

  const { skills = [], experience = [], location = "", title = "", yearsOfExperience = 0 } = resumeData;
  const searchQuery = title || skills[0] || "software engineer";

  // Parallel: fetch real jobs + generate AI-matched jobs
  const [remotiveJobs, aiCompletion] = await Promise.all([
    fetchRemotiveJobs(searchQuery),
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate 12 highly relevant job opportunities for a candidate. Return a JSON object with key "jobs" containing an array. Each job:
id (string "ai-N"), title, company (real companies), location, type ("Full-time"/"Remote"/"Contract"),
salary (e.g. "$90,000 - $130,000/year"), description (2-3 sentences), skills (string array),
matchScore (0-100), matchReasons (array of 2-3 strings),
url (e.g. "https://careers.google.com/jobs/results/123"), source ("AI Matched"),
postedAt (ISO date within last 7 days), logo (null).`,
        },
        {
          role: "user",
          content: `Candidate profile:
Title: ${title}
Skills: ${skills.slice(0, 15).join(", ")}
Experience: ${yearsOfExperience} years
Location: ${location}
Recent roles: ${experience.slice(0, 2).map((e) => `${e.role} at ${e.company}`).join("; ")}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  ]);

  // Parse AI jobs
  let aiJobs = [];
  try {
    const parsed = JSON.parse(aiCompletion.choices[0].message.content);
    aiJobs = parsed.jobs || [];
  } catch {
    aiJobs = [];
  }

  // Score remotive jobs (batch)
  let scoredRemotive = remotiveJobs;
  if (remotiveJobs.length > 0) {
    try {
      const scoreResp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Score each job for the candidate 0-100. Return JSON: {"scored":[{id,matchScore,matchReasons}]}`,
          },
          {
            role: "user",
            content: `Candidate: ${title}, skills: ${skills.slice(0, 10).join(", ")}, ${yearsOfExperience}yrs, ${location}
Jobs: ${JSON.stringify(
  remotiveJobs.slice(0, 10).map((j) => ({
    id: j.id,
    title: j.title,
    skills: j.skills.slice(0, 8),
    description: j.description.substring(0, 150),
  }))
)}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const scoreData = JSON.parse(scoreResp.choices[0].message.content);
      const scoreMap = Object.fromEntries((scoreData.scored || []).map((s) => [s.id, s]));
      scoredRemotive = remotiveJobs.map((j) => ({
        ...j,
        matchScore: scoreMap[j.id]?.matchScore ?? 60,
        matchReasons: scoreMap[j.id]?.matchReasons ?? ["Relevant role", "Skills alignment"],
      }));
    } catch {
      scoredRemotive = remotiveJobs.map((j) => ({
        ...j,
        matchScore: 60,
        matchReasons: ["Relevant role", "Skills alignment"],
      }));
    }
  }

  const allJobs = [...aiJobs, ...scoredRemotive].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  res.status(200).json({ success: true, jobs: allJobs, total: allJobs.length });
}
