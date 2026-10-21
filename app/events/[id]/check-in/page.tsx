import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Nav from "../../../components/Nav";
import BackButton from "../../../components/BackButton";
import CheckInPanel from "../../../components/wallet/CheckInPanel";
import { api, ApiError } from "../../../lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

const U32_MAX = 0xffff_ffff;

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id <= U32_MAX ? id : null;
}

export const metadata: Metadata = {
  title: "Check-in | Inowo",
};

export default async function CheckInPage({ params }: Props) {
  await connection();
  const id = parseId((await params).id);
  if (id === null) notFound();

  let event, tiers;
  try {
    [event, tiers] = await Promise.all([api.event(id), api.tiers(id)]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <BackButton label="Back to event" />

        <h1 className="text-2xl font-bold mb-1">{event.name}</h1>
        <p className="text-slate-400 text-sm mb-8">Check-in</p>

        <CheckInPanel
          eventId={event.id}
          organizer={event.organizer}
          tierNames={tiers.map((t) => t.name)}
        />
      </div>
    </div>
  );
}
