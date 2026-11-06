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

const DirectorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    workId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    shortName: { type: String, required: true },
    title: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    accountKind: { type: String, enum: ["commission", "technical", "staff"], required: true },
  },
  { versionKey: false },
);

const MembershipSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    role: { type: String, required: true },
    electionId: { type: String, required: true },
    pollingStationIds: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { versionKey: false },
);

const OtpSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    demoOtp: { type: String, required: true },
    expiresAt: { type: Number, required: true },
  },
  { versionKey: false },
);

const AttemptSchema = new Schema(
  {
    workId: { type: String, required: true, unique: true },
    count: { type: Number, required: true },
    lockedUntil: Number,
  },
  { versionKey: false },
);

const RegistrySchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    updatedAt: { type: Number, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { versionKey: false },
);

const EnrolledStudentSchema = new Schema(
  {
    studentId: { type: String, required: true, unique: true },
    studentIdKey: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    campusId: { type: String, required: true },
    schoolId: { type: String, required: true },
    departmentId: { type: String, default: null },
    courseLabel: { type: String, required: true },
    passwordHash: { type: String, required: true },
    enrolledAt: { type: String, required: true },
  },
  { versionKey: false },
);

export const VoteModel = mongoose.models.Vote || mongoose.model("Vote", VoteSchema);
export const EventModel = mongoose.models.AccessEvent || mongoose.model("AccessEvent", EventSchema);
export const PolicyModel = mongoose.models.AccessPolicy || mongoose.model("AccessPolicy", PolicySchema);
export const PhotoModel = mongoose.models.CandidatePhoto || mongoose.model("CandidatePhoto", PhotoSchema);
export const DirectoryModel = mongoose.models.DirectoryAccount || mongoose.model("DirectoryAccount", DirectorySchema);
export const MembershipModel = mongoose.models.CommissionMembership || mongoose.model("CommissionMembership", MembershipSchema);
export const OtpModel = mongoose.models.AuthOtp || mongoose.model("AuthOtp", OtpSchema);
export const AttemptModel = mongoose.models.LoginAttempt || mongoose.model("LoginAttempt", AttemptSchema);
export const RegistryModel = mongoose.models.ElectionRegistry || mongoose.model("ElectionRegistry", RegistrySchema);
export const EnrolledStudentModel =
  mongoose.models.EnrolledStudent || mongoose.model("EnrolledStudent", EnrolledStudentSchema);
