import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Arbeitnow — free, no auth, has remote + some India-friendly roles
async function fetchArbeitnowJobs(query) {
  try {
    const r = await fetch(
      `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`
    );
    if (!r.ok) return [];
    const data = await r.json();
    return (data.data || []).slice(0, 10).map((j) => ({
      id: `arbeitnow-${j.slug}`,
      title: j.title,
      company: j.company_name,
      location: j.location || "Remote",
      type: j.job_types?.[0] || "Full-time",
      salary: "",
      description: (j.description || "").replace(/<[^>]*>/g, "").substring(0, 400),
      skills: j.tags || [],
      url: j.url,
      logo: null,
      postedAt: j.created_at,
      source: "Arbeitnow",
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

  const {
    skills = [],
    experience = [],
    location = "Hyderabad, India",
    title = "React JS Developer",
    yearsOfExperience = 0,
    name = "",
  } = resumeData;

  // Determine if candidate is India-based
  const isIndiaBased =
    location.toLowerCase().includes("india") ||
    location.toLowerCase().includes("hyderabad") ||
    location.toLowerCase().includes("bangalore") ||
    location.toLowerCase().includes("mumbai") ||
    location.toLowerCase().includes("pune") ||
    location.toLowerCase().includes("chennai") ||
    location.toLowerCase().includes("delhi");

  const city = location.split(",")[0].trim(); // e.g. "Hyderabad"
  const topSkills = skills.slice(0, 12).join(", ");
  const recentRoles = experience
    .slice(0, 2)
    .map((e) => `${e.role} at ${e.company}`)
    .join("; ");

  // Build two AI job batches in parallel:
  // Batch A — Local jobs (Hyderabad / India)
  // Batch B — Remote / worldwide jobs the candidate can also apply to
  const [localCompletion, remoteCompletion, arbeitnowJobs] = await Promise.all([
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a job search expert specialising in the Indian IT job market.
Generate 15 realistic job listings for the candidate's location: ${location}.
Use REAL Indian companies: TCS, Infosys, Wipro, HCL, Tech Mahindra, Cognizant, Accenture India, Capgemini India, Mphasis, LTIMindtree, Hexaware, Persistent Systems, Zensar, Birlasoft, Publicis Sapient India, ThoughtWorks India, Deloitte India, EPAM, GlobalLogic, Nagarro, Mindtree, Mastech Digital, Cyient, Infotech Enterprises, Virtusa, Syntel.
Also include startups/product companies in Hyderabad: Cyient, FactSet, Optum, iGate, Syntel, DXC Technology, Genpact, Conduent.

Return JSON with key "jobs", each job having:
- id (string "local-N")
- title (e.g. "React JS Developer", "Senior Frontend Developer", "UI Developer")
- company (real Indian company name)
- location (must be "${city}, India" or "Hyderabad, India" or "India (Hybrid)" or "India (Remote)")
- type ("Full-time" / "Contract" / "Hybrid")
- salary (Indian format, e.g. "₹8 LPA - ₹14 LPA" or "₹15 LPA - ₹22 LPA" based on experience)
- description (2-3 sentences about the role, specific to React/frontend)
- skills (array matching candidate's skills)
- matchScore (0-100, be generous for strong matches)
- matchReasons (array of 2-3 specific reasons this role matches the candidate)
- url (realistic careers page URL like "https://careers.tcs.com/jobs/react-developer-123")
- source ("India Jobs")
- postedAt (ISO date within last 5 days)
- logo (null)`,
        },
        {
          role: "user",
          content: `Candidate: ${name || "the candidate"}
Title: ${title}
Skills: ${topSkills}
Experience: ${yearsOfExperience} years
Location: ${location}
Recent roles: ${recentRoles}

Generate 15 matching jobs in ${city}/India. Salary should reflect ${yearsOfExperience} years React JS experience in India.`,
        },
      ],
      response_format: { type: "json_object" },
    }),

    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate 8 remote/worldwide job listings that a React JS developer from India can apply to.
Include: global product companies, startups, remote-first companies that hire from India.
Companies like: Toptal, Deel, Remote.com, Automattic, GitLab, Shopify, Buffer, Airbnb (remote), Amazon (India remote), Microsoft India, Google India, Meta India.

Return JSON with key "jobs", each having:
- id (string "remote-N")
- title, company, location ("Remote - Worldwide" or "Remote - India preferred")
- type ("Remote Full-time" / "Remote Contract")
- salary (USD/INR range appropriate for India-based React dev with ${yearsOfExperience} yrs exp)
- description (2-3 sentences)
- skills (array)
- matchScore (0-100)
- matchReasons (array of 2-3 strings)
- url (realistic URL)
- source ("Remote Jobs")
- postedAt (ISO date within last 5 days)
- logo (null)`,
        },
        {
          role: "user",
          content: `Candidate: React JS Developer, ${yearsOfExperience} yrs exp, skills: ${topSkills}`,
        },
      ],
      response_format: { type: "json_object" },
    }),

    fetchArbeitnowJobs(`react ${isIndiaBased ? "remote" : title}`),
  ]);

  // Parse all job batches
  let localJobs = [], remoteJobs = [];
  try {
    const p = JSON.parse(localCompletion.choices[0].message.content);
    localJobs = p.jobs || [];
  } catch { localJobs = []; }

  try {
    const p = JSON.parse(remoteCompletion.choices[0].message.content);
    remoteJobs = p.jobs || [];
  } catch { remoteJobs = []; }

  // Score arbeitnow jobs
  let scoredArbeit = arbeitnowJobs;
  if (arbeitnowJobs.length > 0) {
    try {
      const scoreResp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Score each job 0-100 for this React JS developer from ${location}. Return JSON: {"scored":[{id,matchScore,matchReasons}]}`,
          },
          {
            role: "user",
            content: `Candidate: ${title}, skills: ${topSkills}, ${yearsOfExperience} yrs
Jobs: ${JSON.stringify(arbeitnowJobs.slice(0, 8).map((j) => ({ id: j.id, title: j.title, description: j.description.substring(0, 150) })))}`,
          },
        ],
        response_format: { type: "json_object" },
      });
      const scoreData = JSON.parse(scoreResp.choices[0].message.content);
      const map = Object.fromEntries((scoreData.scored || []).map((s) => [s.id, s]));
      scoredArbeit = arbeitnowJobs.map((j) => ({
        ...j,
        matchScore: map[j.id]?.matchScore ?? 55,
        matchReasons: map[j.id]?.matchReasons ?? ["React skills match", "Remote opportunity"],
      }));
    } catch {
      scoredArbeit = arbeitnowJobs.map((j) => ({
        ...j,
        matchScore: 55,
        matchReasons: ["React skills match", "Remote opportunity"],
      }));
    }
  }

  // Merge: local jobs first (most relevant), then remote, then arbeitnow
  const allJobs = [...localJobs, ...remoteJobs, ...scoredArbeit].sort(
    (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
  );

  res.status(200).json({ success: true, jobs: allJobs, total: allJobs.length });
}
