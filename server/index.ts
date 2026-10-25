import express from "express";
import cors from "cors";
import { connectDb } from "./db";
import { evaluateAccess, parseAllowlist, type AccessMode } from "./ip";
import { EventModel, PhotoModel, PolicyModel, VoteModel } from "./models";

const PORT = Number(process.env.OPS_API_PORT ?? 4000);
const SECRET = process.env.SAKU_OPS_SECRET ?? "saku-ops-demo-key";

const app = express();
app.use(cors());
app.use(express.json({ limit: "6mb" }));

function authorized(req: express.Request) {
  return req.header("x-saku-ops-key") === SECRET;
}

async function getPolicy() {
  const existing = await PolicyModel.findOne({ key: "default" }).lean();
  if (existing) return existing;
  const created = await PolicyModel.create({
    key: "default",
    mode: "open",
    allowedIps: [],
    applyToCommission: false,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
  });
  return created.toObject();
}

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (!authorized(req)) {
    return res.status(401).json({ error: "Operations API key is missing or invalid." });
  }
  return next();
});

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "saku-ops-api",
    mongo: { readyState: (await import("mongoose")).default.connection.readyState },
  });
});

app.get("/policy", async (_req, res) => {
  res.json(await getPolicy());
});

app.put("/policy", async (req, res) => {
  const mode: AccessMode = req.body.mode === "allowlist" ? "allowlist" : "open";
  const allowedIps = Array.isArray(req.body.allowedIps)
    ? req.body.allowedIps.map(String)
    : parseAllowlist(String(req.body.allowedIpsText ?? ""));
  const updated = await PolicyModel.findOneAndUpdate(
    { key: "default" },
    {
      mode,
      allowedIps,
      applyToCommission: Boolean(req.body.applyToCommission),
      updatedAt: new Date().toISOString(),
      updatedBy: String(req.body.updatedBy ?? "commission"),
    },
    { upsert: true, new: true },
  ).lean();
  res.json(updated);
});

app.post("/access/check", async (req, res) => {
  const policy = await getPolicy();
  const result = evaluateAccess(String(req.body.ip ?? ""), policy.mode as AccessMode, policy.allowedIps ?? []);
  res.json({
    ...result,
    mode: policy.mode,
    applyToCommission: policy.applyToCommission,
  });
});

app.post("/access/events", async (req, res) => {
  const event = await EventModel.create({
    at: new Date().toISOString(),
    ip: req.body.ip ?? "",
    userAgent: req.body.userAgent ?? "",
    workstationId: req.body.workstationId ?? "",
    action: String(req.body.action ?? "unknown"),
    actor: req.body.actor ?? "",
    path: req.body.path ?? "",
    allowed: Boolean(req.body.allowed),
    reason: req.body.reason ?? "",
  });
  res.status(201).json(event);
});

app.get("/access/events", async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 200), 500);
  const events = await EventModel.find().sort({ at: -1 }).limit(limit).lean();
  res.json(events);
});

app.post("/votes", async (req, res) => {
  try {
    const vote = await VoteModel.create({
      electionId: String(req.body.electionId ?? "saku-2026"),
      kind: req.body.kind === "cabinet" ? "cabinet" : "election1",
      studentId: String(req.body.studentId ?? ""),
      fullName: String(req.body.fullName ?? ""),
      unitId: req.body.unitId ?? "",
      campusId: req.body.campusId ?? "",
      candidateIds: req.body.candidateIds ?? [],
      candidateNames: req.body.candidateNames ?? [],
      ip: req.body.ip ?? "",
      userAgent: req.body.userAgent ?? "",
      workstationId: req.body.workstationId ?? "",
      castAt: new Date().toISOString(),
    });
    res.status(201).json(vote);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return res.status(409).json({ error: "This elector already has a stored ballot." });
    }
    throw error;
  }
});

app.get("/votes", async (req, res) => {
  const kind = typeof req.query.kind === "string" ? req.query.kind : undefined;
  const filter = kind ? { kind } : {};
  const votes = await VoteModel.find(filter).sort({ castAt: -1 }).lean();
  res.json(votes);
});

app.get("/analytics", async (_req, res) => {
  const [votes, events, policy] = await Promise.all([
    VoteModel.find().lean(),
    EventModel.find().sort({ at: -1 }).limit(400).lean(),
    getPolicy(),
  ]);
  const election1 = votes.filter((vote) => vote.kind === "election1");
  const cabinet = votes.filter((vote) => vote.kind === "cabinet");
  const byCampus = new Map<string, number>();
  const byCandidate = new Map<string, number>();
  const byCabinetCandidate = new Map<string, number>();
  const byIp = new Map<string, number>();
  for (const vote of votes) {
    byIp.set(vote.ip || "unknown", (byIp.get(vote.ip || "unknown") ?? 0) + 1);
  }
  for (const vote of election1) {
    byCampus.set(vote.campusId || "unknown", (byCampus.get(vote.campusId || "unknown") ?? 0) + 1);
    for (const name of vote.candidateNames ?? []) {
      byCandidate.set(name, (byCandidate.get(name) ?? 0) + 1);
    }
  }
  for (const vote of cabinet) {
    for (const name of vote.candidateNames ?? []) {
      byCabinetCandidate.set(name, (byCabinetCandidate.get(name) ?? 0) + 1);
    }
  }
  const denied = events.filter((event) => !event.allowed).length;
  res.json({
    policy,
    totals: {
      election1Ballots: election1.length,
      cabinetBallots: cabinet.length,
      accessEvents: events.length,
      deniedAttempts: denied,
    },
    byCampus: [...byCampus.entries()].map(([label, value]) => ({ label, value })),
    byCandidate: [...byCandidate.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    byCabinetCandidate: [...byCabinetCandidate.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    byIp: [...byIp.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    recentEvents: events.slice(0, 40),
    voters: election1.map((vote) => ({
      studentId: vote.studentId,
      fullName: vote.fullName,
      unitId: vote.unitId,
      ip: vote.ip,
      workstationId: vote.workstationId,
      castAt: vote.castAt,
    })),
    cabinetVoters: cabinet.map((vote) => ({
      studentId: vote.studentId,
      fullName: vote.fullName,
      ip: vote.ip,
      workstationId: vote.workstationId,
      castAt: vote.castAt,
    })),
  });
});

app.get("/photos", async (_req, res) => {
  const photos = await PhotoModel.find({}, { data: 0 }).lean();
  res.json(photos);
});

app.get("/photos/:id", async (req, res) => {
  const photo = await PhotoModel.findOne({ candidateId: req.params.id }).lean();
  if (!photo) return res.status(404).json({ error: "No uploaded portrait for this candidate." });
  const buffer = Buffer.from(photo.data, "base64");
  res.setHeader("Content-Type", photo.mimeType);
  res.setHeader("Cache-Control", "private, max-age=60");
  return res.send(buffer);
});

app.put("/photos/:id", async (req, res) => {
  const mimeType = String(req.body.mimeType ?? "");
  const data = String(req.body.data ?? "");
  if (!mimeType.startsWith("image/") || data.length < 32) {
    return res.status(400).json({ error: "Upload a JPEG or PNG portrait." });
  }
  if (data.length > 4_500_000) {
    return res.status(400).json({ error: "Keep the portrait under about 3 MB." });
  }
  const photo = await PhotoModel.findOneAndUpdate(
    { candidateId: req.params.id },
    {
      candidateId: req.params.id,
      kind: req.body.kind ?? "delegate",
      mimeType,
      data,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.body.uploadedBy ?? "commission",
    },
    { upsert: true, new: true, projection: { data: 0 } },
  ).lean();
  return res.json(photo);
});

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`SAKU operations API listening on http://127.0.0.1:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
