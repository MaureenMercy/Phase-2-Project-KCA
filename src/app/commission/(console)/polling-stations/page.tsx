import { redirect } from "next/navigation";

export default function PollingStationsRedirect() {
  redirect("/commission/stations");
}
