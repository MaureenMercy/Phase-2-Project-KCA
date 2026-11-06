import { AuthFrame } from "@/components/auth/AuthFrame";
import { EnrollForm } from "@/components/enroll/EnrollForm";
import { courseOptions } from "@/lib/courses";

export const metadata = {
  title: "Student roll",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function HiddenStudentRollPage() {
  return (
    <AuthFrame
      title="Student roll"
      subtitle="Register one student for Election 1. Name, admission, course, and a password are stored in MongoDB. This page is not linked from the public site."
    >
      <EnrollForm courses={courseOptions()} />
    </AuthFrame>
  );
}
