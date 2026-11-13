import { agentCan, reportStatusLabel } from "@/lib/agent-access";
import { publicStudentIdentity } from "@/lib/student-identity";
import type { AgentRecord, AppStore } from "@/lib/types";

export function agentContext(store: AppStore, agent: AgentRecord) {
  const student = store.studentElectors.find((item) => item.studentId === agent.studentId);
  const identity = student
    ? publicStudentIdentity(student, {
        campuses: store.campuses,
        schools: store.schools,
        departments: store.departments,
      })
    : null;
  const station =
    store.pollingStations.find((item) => item.id === (agent.assignedStationId || agent.permittedStationIds[0])) ??
    store.pollingStations.find((item) => item.id === agent.requestedStationId);
  const election = store.elections.find((item) => item.id === agent.electionId) ?? store.election;
  const attendance = store.agentAttendance.filter((item) => item.agentId === agent.id);
  const openAttendance = attendance.find((item) => !item.checkOutAt);
  const observations = store.agentObservations.filter((item) => item.agentId === agent.id);
  const reports = store.incidents.filter((item) => item.agentId === agent.id);
  const notifications = store.agentNotifications.filter(
    (item) => item.agentId === agent.id || item.studentId === agent.studentId,
  );
  const invitation = store.agentInvitations.find((item) => item.id === agent.invitationId);
  const nextStep = !agentCan(agent, "observe")
    ? agent.accreditationStatus === "PENDING"
      ? "Wait for the Electoral Commission to decide your accreditation. You can review your application in the meantime."
      : agent.accreditationStatus === "SUSPENDED"
        ? "Your accreditation is suspended. Follow the Commission notice and wait for a further decision."
        : agent.accreditationStatus === "REVOKED"
          ? "Your accreditation was revoked. Observation access is closed for this election."
          : "Complete or correct your application if the Commission has asked for more information."
    : openAttendance
      ? "You are checked in. Record observations at your assigned station and submit incidents if needed."
      : "Check in at your assigned polling station when you arrive, then follow the observation instructions.";

  return {
    student,
    identity,
    station,
    election,
    attendance,
    openAttendance,
    observations,
    reports: reports.map((item) => ({
      ...item,
      publicStatus: reportStatusLabel(item.status),
    })),
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    invitation,
    nextStep,
    ballotCandidates: store.cabinetCandidates.filter((item) => {
      const application = store.candidateApplications.find((row) => row.id === agent.candidateApplicationId);
      return application?.contestId && item.contestId === application.contestId;
    }),
    application: store.candidateApplications.find((item) => item.id === agent.candidateApplicationId),
  };
}
