import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { connectDb } from "./db";
import { evaluateAccess, parseAllowlist, type AccessMode } from "./ip";
import {
  AttemptModel,
  DirectoryModel,
  EventModel,
  MembershipModel,
  OtpModel,
  PhotoModel,
  PolicyModel,
  EnrolledStudentModel,
  RegistryModel,
  VoteModel,
} from "./models";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFile(path.join(backendRoot, ".env"));
loadEnvFile(path.join(backendRoot, "..", ".env.local"));

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

function withoutMongoId<T extends Record<string, unknown>>(doc: T | null) {
  if (!doc) return null;
  const { _id: _ignored, ...rest } = doc;
  return rest;
}

type DirectoryBody = {
  id?: unknown;
  workId?: unknown;
  fullName?: unknown;
  shortName?: unknown;
  title?: unknown;
  email?: unknown;
  passwordHash?: unknown;
  accountKind?: unknown;
};

type MemberBody = {
  id?: unknown;
  userId?: unknown;
  role?: unknown;
  electionId?: unknown;
  pollingStationIds?: unknown;
  active?: unknown;
};

app.put("/directory/sync", async (req, res) => {
  const accounts: DirectoryBody[] = Array.isArray(req.body.accounts) ? req.body.accounts : [];
  const members: MemberBody[] = Array.isArray(req.body.members) ? req.body.members : [];
  const accountRows = accounts.filter(
    (account): account is DirectoryBody & { id: unknown; workId: unknown; passwordHash: unknown } =>
      Boolean(account && account.id && account.workId && account.passwordHash),
  );
  const memberRows = members.filter(
    (member): member is MemberBody & { id: unknown; userId: unknown } =>
      Boolean(member && member.id && member.userId),
  );
  if (accountRows.length) {
    await DirectoryModel.bulkWrite(
      accountRows.map((account) => ({
          updateOne: {
            filter: { workId: String(account.workId).toUpperCase() },
            update: {
              $set: {
                id: String(account.id),
                workId: String(account.workId).toUpperCase(),
                fullName: String(account.fullName ?? ""),
                shortName: String(account.shortName ?? ""),
                title: String(account.title ?? ""),
                email: String(account.email ?? ""),
                passwordHash: String(account.passwordHash),
                accountKind: account.accountKind === "technical" || account.accountKind === "staff" ? account.accountKind : "commission",
              },
            },
            upsert: true,
          },
        })),
    );
  }
  if (memberRows.length) {
    await MembershipModel.bulkWrite(
      memberRows.map((member) => ({
          updateOne: {
            filter: { id: String(member.id) },
            update: {
              $set: {
                id: String(member.id),
                userId: String(member.userId),
                role: String(member.role ?? ""),
                electionId: String(member.electionId ?? ""),
                pollingStationIds: Array.isArray(member.pollingStationIds) ? member.pollingStationIds.map(String) : [],
                active: member.active !== false,
              },
            },
            upsert: true,
          },
        })),
    );
  }
  res.json({
    accounts: await DirectoryModel.countDocuments(),
    members: await MembershipModel.countDocuments(),
  });
});

app.get("/directory/accounts", async (req, res) => {
  const workId = typeof req.query.workId === "string" ? req.query.workId.toUpperCase() : "";
  const id = typeof req.query.id === "string" ? req.query.id : "";
  const account = workId
    ? await DirectoryModel.findOne({ workId }).lean()
    : id
      ? await DirectoryModel.findOne({ id }).lean()
      : null;
  if (!account) return res.status(404).json({ error: "Directory account was not found." });
  return res.json(withoutMongoId(account));
});

app.get("/directory/members", async (req, res) => {
  const userId = typeof req.query.userId === "string" ? req.query.userId : "";
  if (!userId) return res.status(400).json({ error: "A user id is required." });
  const member = await MembershipModel.findOne({ userId }).lean();
  if (!member) return res.status(404).json({ error: "Commission membership was not found." });
  return res.json(withoutMongoId(member));
});

app.put("/auth/otp/:userId", async (req, res) => {
  const saved = await OtpModel.findOneAndUpdate(
    { userId: req.params.userId },
    {
      userId: req.params.userId,
      hash: String(req.body.hash ?? ""),
      demoOtp: String(req.body.demoOtp ?? ""),
      expiresAt: Number(req.body.expiresAt ?? 0),
    },
    { upsert: true, new: true },
  ).lean();
  res.json(withoutMongoId(saved));
});

app.get("/auth/otp/:userId", async (req, res) => {
  const pending = await OtpModel.findOne({ userId: req.params.userId }).lean();
  if (!pending) return res.status(404).json({ error: "No one-time password is waiting." });
  return res.json(withoutMongoId(pending));
});

app.delete("/auth/otp/:userId", async (req, res) => {
  await OtpModel.deleteOne({ userId: req.params.userId });
  res.json({ ok: true });
});

app.get("/auth/attempts/:workId", async (req, res) => {
  const attempt = await AttemptModel.findOne({ workId: req.params.workId.toUpperCase() }).lean();
  if (!attempt) return res.status(404).json({ error: "No failed attempts are stored." });
  return res.json(withoutMongoId(attempt));
});

app.put("/auth/attempts/:workId", async (req, res) => {
  const workId = req.params.workId.toUpperCase();
  const saved = await AttemptModel.findOneAndUpdate(
    { workId },
    {
      workId,
      count: Number(req.body.count ?? 0),
      lockedUntil: req.body.lockedUntil ? Number(req.body.lockedUntil) : undefined,
    },
    { upsert: true, new: true },
  ).lean();
  res.json(withoutMongoId(saved));
});

app.delete("/auth/attempts/:workId", async (req, res) => {
  await AttemptModel.deleteOne({ workId: req.params.workId.toUpperCase() });
  res.json({ ok: true });
});

app.get("/registry", async (_req, res) => {
  const registry = await RegistryModel.findOne({ key: "app" }).lean();
  if (!registry) return res.status(404).json({ error: "The election registry has not been stored yet." });
  return res.json({ updatedAt: registry.updatedAt, payload: registry.payload });
});

app.put("/registry", async (req, res) => {
  if (!req.body.payload || typeof req.body.payload !== "object") {
    return res.status(400).json({ error: "Registry payload is missing." });
  }
  const updatedAt = Number(req.body.updatedAt ?? Date.now());
  await RegistryModel.findOneAndUpdate(
    { key: "app" },
    { key: "app", updatedAt, payload: req.body.payload },
    { upsert: true },
  );
  return res.json({ ok: true, updatedAt });
});

function studentIdKey(value: string) {
  return String(value ?? "").trim().toUpperCase();
}

function publicEnrolled(row: {
  studentId: string;
  fullName: string;
  campusId: string;
  schoolId: string;
  departmentId?: string | null;
  courseLabel: string;
  enrolledAt: string;
  passwordHash?: string;
}) {
  return {
    studentId: row.studentId,
    fullName: row.fullName,
    campusId: row.campusId,
    schoolId: row.schoolId,
    departmentId: row.departmentId ?? null,
    courseLabel: row.courseLabel,
    enrolledAt: row.enrolledAt,
  };
}

app.get("/enrolled", async (_req, res) => {
  const rows = await EnrolledStudentModel.find({}, { passwordHash: 0 }).sort({ enrolledAt: -1 }).lean();
  res.json(rows.map(publicEnrolled));
});

app.get("/enrolled/:studentId", async (req, res) => {
  const key = studentIdKey(req.params.studentId);
  const row = await EnrolledStudentModel.findOne({ studentIdKey: key }).lean();
  if (!row) return res.status(404).json({ error: "That admission number is not on the operator roll." });
  return res.json({
    ...publicEnrolled(row),
    passwordHash: row.passwordHash,
  });
});

app.put("/enrolled/:studentId", async (req, res) => {
  const studentId = String(req.body.studentId ?? req.params.studentId ?? "").trim();
  const key = studentIdKey(studentId);
  const fullName = String(req.body.fullName ?? "").trim();
  const campusId = String(req.body.campusId ?? "").trim();
  const schoolId = String(req.body.schoolId ?? "").trim();
  const departmentId = req.body.departmentId ? String(req.body.departmentId).trim() : null;
  const courseLabel = String(req.body.courseLabel ?? "").trim();
  const passwordHash = String(req.body.passwordHash ?? "").trim();
  if (!key || !fullName || !campusId || !schoolId || !courseLabel || passwordHash.length < 20) {
    return res.status(400).json({ error: "Name, admission, course, and password are required." });
  }
  const existing = await EnrolledStudentModel.findOne({ studentIdKey: key }).lean();
  if (existing) {
    return res.status(409).json({ error: "That admission number is already on the operator roll." });
  }
  const enrolledAt = new Date().toISOString();
  const row = await EnrolledStudentModel.create({
    studentId,
    studentIdKey: key,
    fullName,
    campusId,
    schoolId,
    departmentId,
    courseLabel,
    passwordHash,
    enrolledAt,
  });
  return res.json(publicEnrolled(row.toObject()));
});

app.post("/demo/reset", async (_req, res) => {
  if (process.env.SAKU_DEMO !== "1") {
    return res.status(404).json({ error: "Not found." });
  }
  await Promise.all([
    VoteModel.deleteMany({}),
    EventModel.deleteMany({}),
    RegistryModel.deleteMany({}),
    EnrolledStudentModel.deleteMany({}),
    OtpModel.deleteMany({}),
    AttemptModel.deleteMany({}),
  ]);
  return res.json({ ok: true });
});

app.get("/records/summary", async (_req, res) => {
  const [accounts, members, registry, ballots, events, portraits, otpChallenges, enrolled] = await Promise.all([
    DirectoryModel.find({}, { passwordHash: 0 }).lean(),
    MembershipModel.find().lean(),
    RegistryModel.findOne({ key: "app" }).lean(),
    VoteModel.countDocuments(),
    EventModel.find().sort({ at: -1 }).limit(12).lean(),
    PhotoModel.countDocuments(),
    OtpModel.countDocuments(),
    EnrolledStudentModel.find({}, { passwordHash: 0 }).sort({ enrolledAt: -1 }).lean(),
  ]);
  const payload = (registry?.payload ?? {}) as {
    studentElectors?: Array<{ studentId?: string; fullName?: string; voterStatus?: string; eligibilityStatus?: string }>;
    electoralCollege?: { entries?: Array<{ registrationNumber?: string; fullName?: string; electorStatus?: string }> };
    delegateVotes?: unknown[];
    cabinetVotes?: unknown[];
    auditLog?: unknown[];
    voterRegister?: { version?: string; status?: string; voterCount?: number };
  };
  const roleByUser = new Map(members.map((member) => [member.userId, member.role]));
  const electors = payload.studentElectors ?? [];
  const college = payload.electoralCollege?.entries ?? [];
  res.json({
    database: "saku",
    storage: process.env.MONGODB_URI ? "MongoDB" : "MongoDB (embedded, data/mongo)",
    registryUpdatedAt: registry?.updatedAt ?? null,
    counts: {
      commissionAccounts: accounts.length,
      memberships: members.length,
      studentElectors: electors.length,
      collegeElectors: college.length,
      delegateVotes: payload.delegateVotes?.length ?? 0,
      cabinetVotes: payload.cabinetVotes?.length ?? 0,
      storedBallots: ballots,
      accessEvents: await EventModel.countDocuments(),
      portraits,
      otpChallenges,
      auditEntries: payload.auditLog?.length ?? 0,
      enrolledStudents: enrolled.length,
    },
    voterRegister: payload.voterRegister ?? null,
    accounts: accounts.map((account) => ({
      workId: account.workId,
      fullName: account.fullName,
      title: account.title,
      accountKind: account.accountKind,
      role: roleByUser.get(account.id) ?? null,
    })),
    electors: electors.slice(0, 40).map((student) => ({
      studentId: student.studentId ?? "",
      fullName: student.fullName ?? "",
      voterStatus: student.voterStatus ?? "",
      eligibilityStatus: student.eligibilityStatus ?? "",
    })),
    enrolled: enrolled.map(publicEnrolled),
    college: college.slice(0, 20).map((entry) => ({
      registrationNumber: entry.registrationNumber ?? "",
      fullName: entry.fullName ?? "",
      electorStatus: entry.electorStatus ?? "",
    })),
    recentAccess: events.map((event) => ({
      at: event.at,
      action: event.action,
      actor: event.actor ?? "",
      path: event.path ?? "",
      allowed: event.allowed,
    })),
  });
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
