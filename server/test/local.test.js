import { test } from "node:test";
import assert from "node:assert/strict";
import { extractSkills, cvSkillSet, classifyJobSkills, cosineSimilarity, analyzeLocal } from "../engine/local.js";

const names = (skills) => skills.map((s) => s.name);

test("extractSkills matches symbols and does not confuse Java with JavaScript", () => {
  const found = names(extractSkills("I write JavaScript, C#, C++ and Node.js with MongoDB."));
  assert.ok(found.includes("JavaScript"));
  assert.ok(found.includes("C#"));
  assert.ok(found.includes("C++"));
  assert.ok(found.includes("Node.js"));
  assert.ok(found.includes("MongoDB"));
  assert.ok(!found.includes("Java"));
});

test("extractSkills finds Java when it is written on its own", () => {
  assert.ok(names(extractSkills("Sweet Cupcake Shop (Java)")).includes("Java"));
});

test("classifyJobSkills marks nice-to-have skills from hints and sections", () => {
  const jd = [
    "Requirements:",
    "- Python and SQL",
    "- Docker is a plus",
    "Nice to have:",
    "- PyTorch",
  ].join("\n");
  const byName = Object.fromEntries(classifyJobSkills(jd).map((s) => [s.name, s.importance]));
  assert.equal(byName.Python, "required");
  assert.equal(byName.SQL, "required");
  assert.equal(byName.Docker, "nice-to-have");
  assert.equal(byName.PyTorch, "nice-to-have");
});

test("a skill mentioned as required anywhere stays required", () => {
  const jd = "Must know React.\nNice to have: React Native and React.";
  const react = classifyJobSkills(jd).find((s) => s.name === "React");
  assert.equal(react.importance, "required");
});

test("cosineSimilarity is 1 for identical text and 0 for unrelated text", () => {
  assert.ok(Math.abs(cosineSimilarity("react node mongodb", "react node mongodb") - 1) < 1e-9);
  assert.equal(cosineSimilarity("react node mongodb", "painting gardening cooking"), 0);
});

test("analyzeLocal scores a matching CV higher than a non-matching one", () => {
  const jd = "AI Intern. Requirements: Python, Machine Learning, SQL, Git. Nice to have: PyTorch.";
  const good = analyzeLocal("Built machine learning models in Python with PyTorch. Used SQL and Git.", jd);
  const weak = analyzeLocal("Cake shop website in PHP and HTML.", jd);
  assert.ok(good.score > weak.score, `${good.score} should be > ${weak.score}`);
  assert.equal(good.missingSkills.length, 0);
  assert.deepEqual(names(weak.missingSkills).sort(), ["Git", "Machine Learning", "PyTorch", "Python", "SQL"]);
  assert.ok(weak.score >= 0 && good.score <= 100);
});

test("analyzeLocal falls back to word overlap when the job lists no known skills", () => {
  const result = analyzeLocal("friendly cashier customer service", "customer service cashier wanted");
  assert.equal(result.keywordScore.skillCoverage, null);
  assert.ok(result.score > 0);
});

test("cvSkillSet adds implied skills", () => {
  const skills = cvSkillSet("Built APIs with Express and MySQL.");
  assert.ok(skills.has("SQL"));
  assert.ok(skills.has("Node.js"));
  assert.ok(skills.has("JavaScript"));
});
