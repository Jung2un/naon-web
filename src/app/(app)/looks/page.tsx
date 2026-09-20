import { redirect } from "next/navigation";
import { LOOKS_ENABLED } from "@/features/looks/config";
import LooksPage from "@/features/looks/LooksPage";

export default function Page() {
  if (!LOOKS_ENABLED) redirect("/characters");
  return <LooksPage />;
}
