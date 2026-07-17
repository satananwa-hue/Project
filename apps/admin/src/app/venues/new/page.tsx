import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { VenueForm } from "./venue-form";

export default async function NewVenuePage() {
  const profile = await getSession();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-400 hover:text-white">← Dashboard</Link>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">New Venue</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Add a new nightlife venue to the NightCheck directory.
      </p>
      <VenueForm />
    </div>
  );
}
