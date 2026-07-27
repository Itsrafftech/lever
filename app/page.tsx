import { redirect } from "next/navigation";

/** The app has no marketing surface — middleware decides where you land. */
export default function RootPage() {
  redirect("/dashboard");
}
