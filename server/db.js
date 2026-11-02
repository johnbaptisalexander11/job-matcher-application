// Analysis history. Uses MongoDB when MONGODB_URI is set, otherwise keeps the
// last 50 analyses in memory so the app works without installing a database.

import mongoose from "mongoose";

const MAX_IN_MEMORY = 50;
const memory = [];
let Analysis = null;

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("History: MONGODB_URI not set, storing history in memory.");
    return;
  }
  await mongoose.connect(uri);
  Analysis = mongoose.model(
    "Analysis",
    new mongoose.Schema(
      {
        jobTitle: String,
        score: Number,
        verdict: String,
        engine: String,
        result: mongoose.Schema.Types.Mixed,
      },
      { timestamps: true },
    ),
  );
  console.log("History: connected to MongoDB.");
}

function toSummary(doc) {
  return {
    id: String(doc._id ?? doc.id),
    jobTitle: doc.jobTitle,
    score: doc.score,
    verdict: doc.verdict,
    engine: doc.engine,
    createdAt: doc.createdAt,
  };
}

export async function saveAnalysis({ jobTitle, result }) {
  const record = { jobTitle, score: result.score, verdict: result.verdict, engine: result.engine, result };
  if (Analysis) {
    const doc = await Analysis.create(record);
    return String(doc._id);
  }
  const id = crypto.randomUUID();
  memory.unshift({ id, createdAt: new Date(), ...record });
  memory.length = Math.min(memory.length, MAX_IN_MEMORY);
  return id;
}

export async function listAnalyses() {
  if (Analysis) {
    const docs = await Analysis.find({}, { result: 0 }).sort({ createdAt: -1 }).limit(MAX_IN_MEMORY).lean();
    return docs.map(toSummary);
  }
  return memory.map(toSummary);
}

export async function getAnalysis(id) {
  if (Analysis) {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await Analysis.findById(id).lean();
    return doc && { ...toSummary(doc), result: doc.result };
  }
  const doc = memory.find((d) => d.id === id);
  return doc && { ...toSummary(doc), result: doc.result };
}
