import { useState } from "react";

function scoreTone(score) {
  if (score >= 80) return "good";
  if (score >= 60) return "ok";
  if (score >= 40) return "warn";
  return "bad";
}

function ScoreRing({ score, label }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  return (
    <div className={`ring tone-${scoreTone(score)}`}>
      <svg viewBox="0 0 120 120" role="img" aria-label={`${label}: ${score} out of 100`}>
        <circle className="ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="66" textAnchor="middle" className="ring-text">
          {score}
        </text>
      </svg>
      <span className="ring-label">{label}</span>
    </div>
  );
}

function Chips({ skills, kind }) {
  if (!skills.length) return <p className="muted">None</p>;
  return (
    <ul className="chips">
      {skills.map((s) => (
        <li key={s.name} className={`chip chip-${kind} ${s.importance === "nice-to-have" ? "chip-optional" : ""}`} title={s.category}>
          {s.name}
          {s.importance === "nice-to-have" && <span className="chip-note">nice to have</span>}
        </li>
      ))}
    </ul>
  );
}

function List({ items }) {
  if (!items.length) return <p className="muted">Nothing to show.</p>;
  return (
    <ul className="list">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-small"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function Results({ result }) {
  const isAi = result.engine === "ai";
  return (
    <section className="results">
      <div className="card summary-card">
        <div className="scores">
          <ScoreRing score={result.score} label={isAi ? "AI fit score" : "Keyword score"} />
          {isAi && result.keywordScore && <ScoreRing score={result.keywordScore.score} label="Keyword (ATS) score" />}
        </div>
        <div className="summary-text">
          <span className={`verdict tone-${scoreTone(result.score)}`}>{result.verdict}</span>
          <p>{result.summary}</p>
          <p className="muted small">
            {isAi
              ? `Analysed by ${result.model || "Claude"}. The keyword score shows how an automatic CV filter might rank you.`
              : "Offline keyword analysis. Turn on AI for bullet rewrites and personalised advice."}
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Matched skills</h3>
          <Chips skills={result.matchedSkills} kind="match" />
        </div>
        <div className="card">
          <h3>Missing skills</h3>
          <Chips skills={result.missingSkills} kind="missing" />
        </div>
        <div className="card">
          <h3>Strengths</h3>
          <List items={result.strengths} />
        </div>
        <div className="card">
          <h3>Gaps to fix</h3>
          <List items={result.gaps} />
        </div>
      </div>

      {result.bulletRewrites.length > 0 && (
        <div className="card">
          <h3>Improved CV bullets</h3>
          <p className="muted small">Replace anything in [brackets] with your real numbers before using these.</p>
          <div className="rewrites">
            {result.bulletRewrites.map((b, i) => (
              <div className="rewrite" key={i}>
                <p className="before">
                  <span className="tag">Before</span> {b.original}
                </p>
                <p className="after">
                  <span className="tag tag-after">After</span> {b.improved}
                </p>
                <div className="rewrite-foot">
                  <span className="muted small">{b.why}</span>
                  <CopyButton text={b.improved} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Interview prep</h3>
          {result.interviewQuestions.length ? (
            <ol className="questions">
              {result.interviewQuestions.map((q, i) => (
                <li key={i}>
                  <strong>{q.question}</strong>
                  <span className="muted small">{q.tip}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No questions.</p>
          )}
        </div>
        <div className="card">
          <h3>Learning plan</h3>
          {result.learningPlan.length ? (
            <ol className="questions">
              {result.learningPlan.map((step, i) => (
                <li key={i}>
                  <strong>{step.skill}</strong>
                  <span className="muted small">{step.action}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No required skills are missing.</p>
          )}
        </div>
      </div>
    </section>
  );
}
