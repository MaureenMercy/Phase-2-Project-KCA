import { redirect } from "next/navigation";

export default function ResultsRedirect() {
  redirect("/commission/election/results");
}
