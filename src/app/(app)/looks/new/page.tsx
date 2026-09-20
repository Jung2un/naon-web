import { redirect } from "next/navigation";
import { LOOKS_ENABLED } from "@/features/looks/config";
import NewLookPage from "@/features/looks/NewLookPage";

export default function Page(props: PageProps<"/looks/new">) {
  if (!LOOKS_ENABLED) redirect("/characters");
  return <NewLookPage {...props} />;
}
