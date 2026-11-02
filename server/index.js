import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import { analyzeLocal } from "./engine/local.js";
import { aiEnabled, analyzeWithAI, AIAnalysisError } from "./engine/ai.js";
import { connectDb, saveAnalysis, listAnalyses, getAnalysis } from "./db.js";

const PORT = process.env.PORT || 5000;
const MAX_TEXT_CHARS = 40000;
const here = path.dirname(fileURLToPath(import.meta.url));

// Express 4 does not catch errors from async handlers, so pass them on to the error middleware.
const asyncRoute = (fn) => (req, res, next) => fn(req, res, next).catch(next);

const app = express();
app.use(express.json({ limit: "1mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === "application/pdf"),
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiEnabled: aiEnabled() });
});

// Turn an uploaded PDF CV into plain text.
app.post("/api/extract", upload.single("cv"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Please upload a PDF file (max 5 MB)." });
  const parser = new PDFParse({ data: req.file.buffer });
  try {
    const { text } = await parser.getText();
    const clean = text
      .replace(/^-- \d+ of \d+ --$/gm, "") // page markers added by pdf-parse
      .replace(/^[•·\s]+$/gm, "") // lines that only hold bullet symbols
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!clean) return res.status(422).json({ error: "No text found in this PDF. Is it a scanned image? Paste the text instead." });
    res.json({ text: clean });
  } catch {
    res.status(422).json({ error: "Could not read this PDF. Try another file or paste the text." });
  } finally {
    await parser.destroy();
  }
});

function jobTitleFrom(jobText) {
  const first = jobText.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || "Untitled job";
  return first.length > 80 ? `${first.slice(0, 77)}...` : first;
}

app.post("/api/analyze", asyncRoute(async (req, res) => {
  const cvText = String(req.body?.cvText ?? "").trim();
  const jobText = String(req.body?.jobText ?? "").trim();
  const mode = req.body?.mode === "local" ? "local" : "auto";

  if (cvText.length < 50) return res.status(400).json({ error: "Please add your CV (at least a few lines)." });
  if (jobText.length < 50) return res.status(400).json({ error: "Please paste the job description (at least a few lines)." });
  if (cvText.length > MAX_TEXT_CHARS || jobText.length > MAX_TEXT_CHARS) {
    return res.status(413).json({ error: `Each text must be under ${MAX_TEXT_CHARS.toLocaleString()} characters.` });
  }

  // The keyword (ATS-style) score is always computed; it is fast and works offline.
  const local = analyzeLocal(cvText, jobText);
  let result = local;
  let warning;

  if (mode === "auto" && aiEnabled()) {
    try {
      result = { ...(await analyzeWithAI(cvText, jobText)), keywordScore: local.keywordScore };
    } catch (error) {
      if (!(error instanceof AIAnalysisError)) throw error;
      console.error("AI analysis failed:", error.message);
      warning = `${error.message} Showing the offline keyword analysis instead.`;
    }
  }

  const id = await saveAnalysis({ jobTitle: jobTitleFrom(jobText), result });
  res.json({ id, result, warning });
}));

app.get("/api/history", asyncRoute(async (_req, res) => {
  res.json(await listAnalyses());
}));

app.get("/api/history/:id", asyncRoute(async (req, res) => {
  const item = await getAnalysis(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
}));

// In production, serve the built React app.
const dist = path.join(here, "..", "dist");
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (_req, res, next) => {
  res.sendFile(path.join(dist, "index.html"), (err) => err && next());
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

await connectDb();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (AI ${aiEnabled() ? "enabled" : "disabled: using offline keyword engine"})`);
});
