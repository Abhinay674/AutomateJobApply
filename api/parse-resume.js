import { IncomingForm } from "formidable";
import { readFileSync } from "fs";
import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { connectDB } from "../lib/mongodb.js";
import { Resume } from "../lib/models.js";
import { randomUUID } from "crypto";

export const config = { api: { bodyParser: false } };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function extractText(filepath, mimetype) {
  const buffer = readFileSync(filepath);
  if (mimetype === "application/pdf" || filepath.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filepath.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString("utf-8");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Parse multipart form
  const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024, keepExtensions: true });
  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, f, fi) => (err ? reject(err) : resolve([f, fi])));
  });

  const file = Array.isArray(files.resume) ? files.resume[0] : files.resume;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const resumeText = await extractText(file.filepath, file.mimetype);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert resume parser. Extract structured information and return a JSON object with these exact keys:
name, email, phone, location, title, yearsOfExperience (number), skills (string array),
experience (array of {company,role,duration,description}),
education (array of {degree,institution,year}), summary (2-3 sentence summary).
Return ONLY valid JSON.`,
        },
        { role: "user", content: `Parse this resume:\n\n${resumeText.substring(0, 8000)}` },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const sessionId = randomUUID();

    await connectDB();
    const saved = await Resume.create({
      sessionId,
      ...parsed,
      rawTextSnippet: resumeText.substring(0, 500),
    });

    res.status(200).json({ success: true, sessionId, resumeId: saved._id, data: parsed });
  } catch (err) {
    console.error("parse-resume error:", err);
    res.status(500).json({ error: err.message || "Failed to parse resume" });
  }
}
