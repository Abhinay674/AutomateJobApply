import formidable from "formidable";
import { readFileSync } from "fs";
import OpenAI from "openai";
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

async function extractText(filepath, originalFilename, mimetype) {
  const buffer = readFileSync(filepath);
  const name = (originalFilename || "").toLowerCase();

  // PDF — use dynamic import to avoid serverless init errors
  if (mimetype === "application/pdf" || name.endsWith(".pdf")) {
    try {
      const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
      const data = await pdfParse(buffer);
      return data.text;
    } catch {
      // Fallback: return raw buffer as string (best effort)
      return buffer.toString("latin1");
    }
  }

  // DOCX
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // TXT / plain
  return buffer.toString("utf-8");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // formidable v3 — promise-based API
  const form = formidable({ maxFileSize: 10 * 1024 * 1024, keepExtensions: true });

  let files;
  try {
    [, files] = await form.parse(req);
  } catch (err) {
    return res.status(400).json({ error: `File upload failed: ${err.message}` });
  }

  const fileArr = files.resume;
  const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;
  if (!file) return res.status(400).json({ error: "No file uploaded. Make sure the field name is 'resume'." });

  try {
    const resumeText = await extractText(file.filepath, file.originalFilename, file.mimetype);

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({ error: "Could not extract text from the file. Please try a different format." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert resume parser. Extract structured information and return a JSON object with these exact keys:
name (string), email (string), phone (string), location (string), title (string),
yearsOfExperience (number), skills (string array, min 5),
experience (array of {company,role,duration,description}),
education (array of {degree,institution,year}),
summary (string, 2-3 sentences).
If a field cannot be found use an empty string or empty array. Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: `Parse this resume and extract all information:\n\n${resumeText.substring(0, 8000)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    const sessionId = randomUUID();

    // Save to MongoDB (non-blocking — don't fail if DB is down)
    let resumeId = null;
    try {
      await connectDB();
      const saved = await Resume.create({
        sessionId,
        ...parsed,
        rawTextSnippet: resumeText.substring(0, 500),
      });
      resumeId = saved._id;
    } catch (dbErr) {
      console.error("MongoDB save failed (non-fatal):", dbErr.message);
    }

    res.status(200).json({ success: true, sessionId, resumeId, data: parsed });
  } catch (err) {
    console.error("parse-resume error:", err);
    res.status(500).json({ error: err.message || "Failed to parse resume" });
  }
}
