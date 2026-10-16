"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  friendlyError,
  inowo,
  parseUsdc,
  type TierInput,
} from "../../lib/contract";
import ConnectButton from "./ConnectButton";
import { buttonClass, inputClass } from "./styles";
import { useWallet } from "./WalletProvider";

const MAX_TIERS = 10;
const U32_MAX = 0xffff_ffff;

interface TierDraft {
  name: string;
  price: string;
  supplyCap: string;
}

const emptyTier = (): TierDraft => ({ name: "", price: "", supplyCap: "" });

/** Validates the form; returns the contract input, or the first problem found. */
function validate(form: {
  name: string;
  description: string;
  venue: string;
  date: string;
  goal: string;
  tiers: TierDraft[];
}):
  | { ok: true; dateUnix: number; fundingGoal: bigint; tiers: TierInput[] }
  | { ok: false; error: string } {
  if (!form.name.trim()) return { ok: false, error: "Give the event a name." };
  if (!form.venue.trim()) return { ok: false, error: "Add a venue." };

  const dateMs = Date.parse(form.date);
  if (Number.isNaN(dateMs))
    return { ok: false, error: "Choose a date and time." };
  if (dateMs <= Date.now())
    return { ok: false, error: "The event date must be in the future." };

  const fundingGoal = parseUsdc(form.goal);
  if (fundingGoal === null || fundingGoal <= BigInt(0)) {
    return {
      ok: false,
      error: "The funding goal must be a positive USDC amount.",
    };
  }

  if (form.tiers.length === 0)
    return { ok: false, error: "Add at least one ticket tier." };
  const tiers: TierInput[] = [];
  for (const [i, t] of form.tiers.entries()) {
    const label = `Tier ${i + 1}`;
    if (!t.name.trim()) return { ok: false, error: `${label} needs a name.` };
    const price = parseUsdc(t.price);
    if (price === null || price <= BigInt(0)) {
      return { ok: false, error: `${label} needs a price above zero.` };
    }
    const cap = Number(t.supplyCap);
    if (!/^\d+$/.test(t.supplyCap.trim()) || cap < 1 || cap > U32_MAX) {
      return { ok: false, error: `${label} needs at least 1 ticket.` };
    }
    tiers.push({ name: t.name.trim(), price, supplyCap: cap });
  }

  return { ok: true, dateUnix: Math.floor(dateMs / 1000), fundingGoal, tiers };
}

export default function CreateEventForm() {
  const { address, sign } = useWallet();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [goal, setGoal] = useState("");
  const [tiers, setTiers] = useState<TierDraft[]>([
    { name: "General", price: "", supplyCap: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTier = (index: number, patch: Partial<TierDraft>) =>
    setTiers((current) =>
      current.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    const checked = validate({ name, description, venue, date, goal, tiers });
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { eventId } = await inowo.createEvent(
        address,
        {
          name: name.trim(),
          description: description.trim(),
          venue: venue.trim(),
          dateUnix: checked.dateUnix,
          fundingGoal: checked.fundingGoal,
          tiers: checked.tiers,
        },
        sign,
      );
      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  if (!address) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl p-8 text-center">
        <p className="font-medium mb-2">Connect a wallet to create an event</p>
        <p className="text-slate-400 text-sm mb-6">
          The connected address becomes the event&apos;s organizer: only it can
          end or cancel the event and release funds.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Labeled id="event-name" label="Event name">
          <input
            id="event-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Lagos Stellar Builders Meetup"
          />
        </Labeled>
        <Labeled id="event-venue" label="Venue">
          <input
            id="event-venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className={inputClass}
            placeholder="e.g. Co-Creation Hub, Yaba"
          />
        </Labeled>
        <Labeled id="event-date" label="Date and time">
          <input
            id="event-date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Labeled>
        <Labeled id="event-goal" label="Funding goal (USDC)">
          <input
            id="event-goal"
            inputMode="decimal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className={inputClass}
            placeholder="e.g. 500"
          />
        </Labeled>
        <div className="sm:col-span-2">
          <Labeled id="event-description" label="Description">
            <textarea
              id="event-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="What is the event, and what will the funding pay for?"
            />
          </Labeled>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-semibold mb-1">Ticket tiers</legend>
        {tiers.map((tier, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_7rem_6rem_auto] gap-2 items-end"
          >
            <Labeled id={`tier-${i}-name`} label={i === 0 ? "Name" : ""}>
              <input
                id={`tier-${i}-name`}
                aria-label={`Tier ${i + 1} name`}
                value={tier.name}
                onChange={(e) => updateTier(i, { name: e.target.value })}
                className={inputClass}
                placeholder="e.g. VIP"
              />
            </Labeled>
            <Labeled
              id={`tier-${i}-price`}
              label={i === 0 ? "Price (USDC)" : ""}
            >
              <input
                id={`tier-${i}-price`}
                aria-label={`Tier ${i + 1} price in USDC`}
                inputMode="decimal"
                value={tier.price}
                onChange={(e) => updateTier(i, { price: e.target.value })}
                className={inputClass}
                placeholder="5"
              />
            </Labeled>
            <Labeled id={`tier-${i}-cap`} label={i === 0 ? "Tickets" : ""}>
              <input
                id={`tier-${i}-cap`}
                aria-label={`Tier ${i + 1} number of tickets`}
                inputMode="numeric"
                value={tier.supplyCap}
                onChange={(e) => updateTier(i, { supplyCap: e.target.value })}
                className={inputClass}
                placeholder="100"
              />
            </Labeled>
            <button
              type="button"
              onClick={() =>
                setTiers((current) => current.filter((_, j) => j !== i))
              }
              disabled={tiers.length === 1}
              aria-label={`Remove tier ${i + 1}`}
              className="h-[38px] px-3 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-400"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTiers((current) => [...current, emptyTier()])}
          disabled={tiers.length >= MAX_TIERS}
          className="text-sm text-violet-400 hover:text-violet-300 disabled:opacity-40"
        >
          + Add tier
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="max-w-xs">
        <button type="submit" disabled={busy} className={buttonClass}>
          {busy ? "Waiting for confirmation…" : "Create event"}
        </button>
      </div>
    </form>
  );
}

function Labeled({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm text-slate-400">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}
