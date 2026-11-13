import Link from "next/link";
import { DemoBanner } from "@/components/commission/DemoBanner";
import { PageHeader } from "@/components/commission/PageHeader";
import { RegisterWizard } from "@/components/voter/RegisterWizard";
import { DEFAULT_IDENTITY_DOCUMENT_POLICY } from "@/lib/identity";
import { loadVoterContext, wizardSnapshotFrom } from "@/lib/voter-guard";
import { readStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Register to vote" };

export default async function VoterRegisterPage() {
  const context = await loadVoterContext();
  const store = context?.store ?? (await readStore());
  const snapshot = context
    ? wizardSnapshotFrom(context)
    : {
        step: 1,
        submitted: false,
        studentId: "",
        fullName: null,
        phoneNumber: "",
        phoneVerified: false,
        nationalIdLast4: "",
        campusName: "",
        schoolName: "",
        departmentName: null,
        programmeName: null,
        programmePending: true,
        unitLabel: null,
        unitPending: true,
        documentPolicy: store.identityDocumentPolicy ?? DEFAULT_IDENTITY_DOCUMENT_POLICY,
        accessibility: {
          declared: false,
          categories: [],
          accommodations: [],
          notes: "",
          updatedAt: null,
          consentToShareOperationally: false,
        },
        campuses: store.campuses.map((item) => ({ id: item.id, name: item.name })),
        schools: store.schools.map((item) => ({ id: item.id, name: item.name, campusId: item.campusId })),
        departments: store.departments.map((item) => ({ id: item.id, name: item.name, schoolId: item.schoolId })),
        programmes: store.programmes.map((item) => ({
          id: item.id,
          name: item.name,
          schoolId: item.schoolId,
          departmentId: item.departmentId,
        })),
      };

  return (
    <main className="min-h-screen bg-cream text-navy">
      <DemoBanner />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <PageHeader eyebrow="Voter registration" title="Register with your student record">
          Five short steps. You can save a draft and continue later. Submitting does not approve you as an eligible elector.
        </PageHeader>
        <p className="text-sm">
          <Link href="/voter" className="text-navy underline">Back to Voter Portal</Link>
          {" · "}
          <Link href="/voter/help" className="text-navy underline">Need help?</Link>
        </p>
        <RegisterWizard snapshot={snapshot} />
      </div>
    </main>
  );
}
