import mongoose, { Schema } from "mongoose";

const VoteSchema = new Schema(
  {
    electionId: { type: String, required: true },
    kind: { type: String, enum: ["election1", "cabinet"], required: true },
    studentId: { type: String, required: true },
    fullName: { type: String, required: true },
    unitId: String,
    campusId: String,
    candidateIds: [String],
    candidateNames: [String],
    ip: String,
    userAgent: String,
    workstationId: String,
    castAt: { type: String, required: true },
  },
  { versionKey: false },
);

VoteSchema.index({ electionId: 1, kind: 1, studentId: 1 }, { unique: true });

const EventSchema = new Schema(
  {
    at: { type: String, required: true },
    ip: String,
    userAgent: String,
    workstationId: String,
    action: { type: String, required: true },
    actor: String,
    path: String,
    allowed: { type: Boolean, required: true },
    reason: String,
  },
  { versionKey: false },
);

const PolicySchema = new Schema(
  {
    key: { type: String, default: "default", unique: true },
    mode: { type: String, enum: ["open", "allowlist"], default: "open" },
    allowedIps: { type: [String], default: [] },
    applyToCommission: { type: Boolean, default: false },
    updatedAt: String,
    updatedBy: String,
  },
  { versionKey: false },
);

const PhotoSchema = new Schema(
  {
    candidateId: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["delegate", "leadership", "cabinet"], required: true },
    mimeType: { type: String, required: true },
    data: { type: String, required: true },
    uploadedAt: String,
    uploadedBy: String,
  },
  { versionKey: false },
);

export const VoteModel = mongoose.models.Vote || mongoose.model("Vote", VoteSchema);
export const EventModel = mongoose.models.AccessEvent || mongoose.model("AccessEvent", EventSchema);
export const PolicyModel = mongoose.models.AccessPolicy || mongoose.model("AccessPolicy", PolicySchema);
export const PhotoModel = mongoose.models.CandidatePhoto || mongoose.model("CandidatePhoto", PhotoSchema);
