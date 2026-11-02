import { useEffect, useState } from "react";
import { analyze, extractPdf, getHealth, getHistory, getHistoryItem } from "./api.js";
import { SAMPLE_JOB } from "./sampleJob.js";
import Results from "./components/Results.jsx";
import History from "./components/History.jsx";

export default function App() {
  const [cvText, setCvText] = useState("");
  const [jobText, setJobText] = useState("");
  const [mode, setMode] = useState("auto");
  const [aiEnabled, setAiEnabled] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHealth().then((h) => setAiEnabled(h.aiEnabled)).catch(() => setAiEnabled(false));
    refreshHistory();
  }, []);

  function refreshHistory() {
    getHistory().then(setHistory).catch(() => {});
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { text } = await extractPdf(file);
      setCvText(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    setError("");
    setWarning("");
    setLoading(true);
    try {
      const data = await analyze(cvText, jobText, mode);
      setResult(data.result);
      if (data.warning) setWarning(data.warning);
      refreshHistory();
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(id) {
    try {
      const item = await getHistoryItem(id);
      setResult(item.result);
      setWarning("");
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    }
  }

  const useAi = mode === "auto" && aiEnabled;

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>CV Job Matcher</h1>
          <p className="subtitle">See how well your CV fits a job, which skills are missing, and how to improve it.</p>
        </div>
        <span className={`badge ${aiEnabled ? "badge-ai" : "badge-local"}`}>
          {aiEnabled === null ? "Checking…" : aiEnabled ? "AI ready" : "Offline mode"}
        </span>
      </header>

      <main>
        <section className="inputs">
          <div className="card">
            <div className="card-head">
              <h2>1. Your CV</h2>
              <label className={`btn btn-secondary ${uploading ? "disabled" : ""}`}>
                {uploading ? "Reading PDF…" : "Upload PDF"}
                <input type="file" accept="application/pdf" onChange={handleFile} hidden disabled={uploading} />
              </label>
            </div>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Upload your CV as a PDF, or paste its text here…"
              aria-label="CV text"
            />
            <p className="hint">{cvText.length.toLocaleString()} characters</p>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>2. Job description</h2>
              <button className="btn btn-secondary" onClick={() => setJobText(SAMPLE_JOB)}>
                Use sample job
              </button>
            </div>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the internship or job description here…"
              aria-label="Job description text"
            />
            <p className="hint">{jobText.length.toLocaleString()} characters</p>
          </div>
        </section>

        <div className="actions">
          <div className="mode" role="radiogroup" aria-label="Analysis mode">
            <label>
              <input type="radio" checked={Boolean(useAi)} onChange={() => setMode("auto")} disabled={!aiEnabled} />
              AI analysis
            </label>
            <label>
              <input type="radio" checked={mode === "local" || !aiEnabled} onChange={() => setMode("local")} />
              Keyword only (offline)
            </label>
          </div>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !cvText.trim() || !jobText.trim()}>
            {loading ? (useAi ? "AI is reading your CV…" : "Analysing…") : "Analyse match"}
          </button>
        </div>
        {aiEnabled === false && (
          <p className="notice">
            AI is off because no API key is set. You still get the offline keyword analysis. Add <code>ANTHROPIC_API_KEY</code>{" "}
            to <code>.env</code> to turn on AI feedback.
          </p>
        )}

        {error && <p className="alert alert-error">{error}</p>}
        {warning && <p className="alert alert-warning">{warning}</p>}

        <div id="results">{result && <Results result={result} />}</div>

        <History items={history} onOpen={openHistory} />
      </main>

      <footer className="footer">Built with React, Node.js, Express, MongoDB and the Claude API.</footer>
    </div>
  );
}
