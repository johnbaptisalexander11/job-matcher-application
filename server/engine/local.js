// Local matching engine: works offline with no API key.
// It behaves like a simple ATS (applicant tracking system): it finds known skills in both
// texts, weights required skills above nice-to-have ones, and adds a text-similarity score.

import { SKILLS } from "./skills.js";

const STOPWORDS = new Set(
  `a about above after again all also am an and any are as at be because been before being below between both but by
  can could did do does doing down during each etc few for from further had has have having he her here hers him his how
  i if in into is it its itself just me more most my no nor not now of off on once only or other our ours out over own
  same she should so some such than that the their them then there these they this those through to too under until up
  very was we were what when where which while who whom why will with would you your yours will able looking work working
  role team candidate candidates experience years year strong good knowledge skills skill using use including etc join
  ability must required requirements responsibilities preferred plus intern internship job company`.split(/\s+/),
);

const OPTIONAL_HINTS = /(nice to have|nice-to-have|preferred|bonus|a plus|is a plus|desirable|good to have|optional|familiarity)/i;
const OPTIONAL_SECTION = /^(nice to have|preferred|bonus|good to have|desirable)/i;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Pre-compile one regex per skill. Boundaries are "not a letter/digit" so that
// symbols inside names (c++, c#, node.js, ci/cd) still match.
const SKILL_PATTERNS = SKILLS.map((skill) => ({
  ...skill,
  regex: new RegExp(
    `(?<![a-z0-9+#])(?:${skill.aliases.map(escapeRegex).join("|")})(?![a-z0-9+#])`,
    "i",
  ),
}));

export function extractSkills(text) {
  return SKILL_PATTERNS.filter((s) => s.regex.test(text)).map(({ name, category }) => ({ name, category }));
}

const BY_NAME = new Map(SKILLS.map((s) => [s.name, s]));

// Skills found in a CV plus the skills they imply (e.g. MySQL -> SQL).
export function cvSkillSet(text) {
  const names = new Set(extractSkills(text).map((s) => s.name));
  for (const name of [...names]) {
    for (const implied of BY_NAME.get(name).implies ?? []) names.add(implied);
  }
  return names;
}

// Decide whether each job skill is required or nice-to-have by looking at the line
// (and the section heading) where it is mentioned.
export function classifyJobSkills(jobText) {
  const lines = jobText.split(/\r?\n/);
  const importance = new Map();
  let inOptionalSection = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const isHeading = line.length < 60 && /:$|^#+\s|^[A-Z][A-Za-z &/-]+$/.test(line);
    if (isHeading) inOptionalSection = OPTIONAL_SECTION.test(line.replace(/^#+\s*/, ""));

    const optional = inOptionalSection || OPTIONAL_HINTS.test(line);
    for (const skill of SKILL_PATTERNS) {
      if (!skill.regex.test(line)) continue;
      // A skill mentioned anywhere as required stays required.
      if (importance.get(skill.name) !== "required") {
        importance.set(skill.name, optional ? "nice-to-have" : "required");
      }
    }
  }

  return SKILL_PATTERNS.filter((s) => importance.has(s.name)).map(({ name, category }) => ({
    name,
    category,
    importance: importance.get(name),
  }));
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^\.+|\.+$/g, ""))
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

function termFrequencies(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

// Cosine similarity between the word-frequency vectors of two texts (0..1).
export function cosineSimilarity(a, b) {
  const ta = termFrequencies(tokenize(a));
  const tb = termFrequencies(tokenize(b));
  let dot = 0;
  for (const [term, count] of ta) dot += count * (tb.get(term) || 0);
  const norm = (m) => Math.sqrt([...m.values()].reduce((sum, v) => sum + v * v, 0));
  const denom = norm(ta) * norm(tb);
  return denom === 0 ? 0 : dot / denom;
}

function verdictFor(score) {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Partial match";
  return "Weak match";
}

// Simple CV quality checks that recruiters care about.
function cvQualityTips(cvText) {
  const tips = [];
  const bulletLines = cvText.split(/\r?\n/).filter((l) => /^\s*([•\-*▪●]|\d+\.)\s+/.test(l) || l.trim().length > 40);
  const withNumbers = bulletLines.filter((l) => /\d+\s*(%|\+|x\b|users|students|ms|seconds|hours|endpoints|modules)/i.test(l));
  if (withNumbers.length < 3) {
    tips.push("Add measurable results to your bullets (e.g. users served, response time improved, number of endpoints).");
  }
  if (!/github\.com\//i.test(cvText)) tips.push("Add GitHub links so recruiters can see your code.");
  if (!/linkedin\.com\//i.test(cvText)) tips.push("Add your LinkedIn profile URL.");
  const words = tokenize(cvText).length;
  if (words < 150) tips.push("Your CV looks short; describe your projects in more detail.");
  return tips;
}

export function analyzeLocal(cvText, jobText) {
  const cvSkills = cvSkillSet(cvText);
  const jobSkills = classifyJobSkills(jobText);

  const matchedSkills = jobSkills.filter((s) => cvSkills.has(s.name));
  const missingSkills = jobSkills.filter((s) => !cvSkills.has(s.name));

  // Required skills count fully, nice-to-have skills count half.
  const weight = (s) => (s.importance === "required" ? 1 : 0.5);
  const totalWeight = jobSkills.reduce((sum, s) => sum + weight(s), 0);
  const matchedWeight = matchedSkills.reduce((sum, s) => sum + weight(s), 0);
  const skillCoverage = totalWeight === 0 ? null : matchedWeight / totalWeight;

  // Word overlap between two different documents rarely goes above ~0.5, so scale it up.
  const similarity = cosineSimilarity(cvText, jobText);
  const similarityScore = Math.min(1, similarity * 2);

  const raw = skillCoverage === null ? similarityScore : 0.75 * skillCoverage + 0.25 * similarityScore;
  const score = Math.round(raw * 100);

  const requiredMissing = missingSkills.filter((s) => s.importance === "required");
  const strengths = matchedSkills.length
    ? [`Your CV covers ${matchedSkills.length} of the ${jobSkills.length} skills this job mentions: ${matchedSkills.map((s) => s.name).join(", ")}.`]
    : [];
  const gaps = [];
  if (requiredMissing.length) gaps.push(`Missing required skills: ${requiredMissing.map((s) => s.name).join(", ")}.`);
  const optionalMissing = missingSkills.filter((s) => s.importance !== "required");
  if (optionalMissing.length) gaps.push(`Missing nice-to-have skills: ${optionalMissing.map((s) => s.name).join(", ")}.`);
  gaps.push(...cvQualityTips(cvText));

  return {
    engine: "local",
    score,
    verdict: verdictFor(score),
    summary:
      jobSkills.length === 0
        ? "No known skills were found in the job description, so this score is based on word overlap only."
        : `Keyword analysis: ${matchedSkills.length}/${jobSkills.length} job skills found in your CV (${requiredMissing.length} required skill${requiredMissing.length === 1 ? "" : "s"} missing).`,
    matchedSkills,
    missingSkills,
    strengths,
    gaps,
    bulletRewrites: [],
    interviewQuestions: matchedSkills.slice(0, 5).map((s) => ({
      question: `Tell me about a project where you used ${s.name}. What problem did it solve?`,
      tip: "Answer with the STAR method: Situation, Task, Action, Result.",
    })),
    learningPlan: requiredMissing.slice(0, 5).map((s) => ({
      skill: s.name,
      action: `Build a small project that uses ${s.name}, push it to GitHub, and add it to your CV.`,
    })),
    keywordScore: {
      score,
      skillCoverage: skillCoverage === null ? null : Math.round(skillCoverage * 100),
      textSimilarity: Math.round(similarity * 100),
    },
  };
}
