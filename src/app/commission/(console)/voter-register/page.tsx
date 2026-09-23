import { redirect } from "next/navigation";

export default function VoterRegisterRedirect() {
  redirect("/commission/voters");
}
