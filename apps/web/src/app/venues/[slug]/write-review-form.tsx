"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "./review-actions";

const STARS = [1, 2, 3, 4, 5] as const;
const RATING_LABELS: Record<number, string> = { 1: "Terrible", 2: "Poor", 3: "OK", 4: "Good", 5: "Excellent" };

function StarPicker({
  value, onChange, size = "text-2xl",
}: { value: number; onChange: (v: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {STARS.map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          aria-label={`Rate ${s} out of 5`}
          className={`${size} leading-none transition-transform hover:scale-110 ${s <= (hover || value) ? "text-accent" : "text-border"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function calcPoints(overall: number, text: string, music: string, price: string, crowd: string) {
  let pts = 0;
  if (overall > 0) pts += 1;
  if (text.trim().length > 0) pts += 10;
  if (text.trim().length >= 200) pts += 5;
  if (music.trim().length > 0) pts += 2;
  if (price.trim().length > 0) pts += 2;
  if (crowd.trim().length > 0) pts += 2;
  return pts;
}

// Post-submit success panel
function SuccessPanel({
  venueName, points, ratingPts, reviewPts, bonusPts, notesPts,
}: {
  venueName: string;
  points: number; ratingPts: number; reviewPts: number; bonusPts: number; notesPts: number;
}) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <span className="text-3xl text-accent">✓</span>
        </div>
        <p className="text-3xl font-bold text-accent">+{points} pts</p>
        <p className="mt-1 text-sm text-muted">Thanks for helping others discover their next spot!</p>
      </div>

      {/* Breakdown */}
      <div className="rounded-lg border border-border p-3 text-sm">
        {ratingPts > 0 && <PointRow label="Rating" pts={ratingPts} />}
        {reviewPts > 0 && <PointRow label="Review" pts={reviewPts} />}
        {bonusPts > 0 && <PointRow label="Bonus (200+ chars)" pts={bonusPts} />}
        {notesPts > 0 && <PointRow label="Extra notes" pts={notesPts} />}
      </div>

      <button
        onClick={() => router.push("/venues")}
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
      >
        Rate Another Place
      </button>
    </div>
  );
}

function PointRow({ label, pts }: { label: string; pts: number }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-accent">+{pts}</span>
    </div>
  );
}


export function WriteReviewForm({
  venueId, slug, venueName = "",
}: { venueId: string; slug: string; venueName?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Main fields
  const [overall, setOverall] = useState(0);
  const [text, setText] = useState("");
  // Sub-ratings
  const [food, setFood] = useState(0);
  const [service, setService] = useState(0);
  const [atmosphere, setAtmosphere] = useState(0);
  // Extra notes
  const [musicNotes, setMusicNotes] = useState("");
  const [priceNotes, setPriceNotes] = useState("");
  const [crowdNotes, setCrowdNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [earnedPts, setEarnedPts] = useState({ total: 0, rating: 0, review: 0, bonus: 0, notes: 0 });

  const charCount = text.trim().length;
  const bonusUnlocked = charCount >= 200;
  const totalPts = calcPoints(overall, text, musicNotes, priceNotes, crowdNotes);
  const showPreview = overall > 0 || text.trim().length > 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!overall) { setError("Please select a star rating."); return; }
    setError(null);
    const fd = new FormData(e.currentTarget);
    const tags: string[] = [];
    if (food > 0) tags.push(`food-${food}`);
    if (service > 0) tags.push(`service-${service}`);
    if (atmosphere > 0) tags.push(`atmosphere-${atmosphere}`);
    fd.set("tags", JSON.stringify(tags));

    const rPts = overall > 0 ? 1 : 0;
    const rvPts = text.trim().length > 0 ? 10 : 0;
    const bPts = bonusUnlocked ? 5 : 0;
    const nPts = [musicNotes, priceNotes, crowdNotes].filter((n) => n.trim()).length * 2;

    startTransition(async () => {
      const result = await submitReviewAction(venueId, slug, fd);
      if (!result.ok) { setError(result.error); return; }
      setEarnedPts({ total: rPts + rvPts + bPts + nPts, rating: rPts, review: rvPts, bonus: bPts, notes: nPts });
      setSubmitted(true);
      router.refresh();
    });
  }

  if (submitted) {
    return (
      <SuccessPanel
        venueName={venueName}
        points={earnedPts.total}
        ratingPts={earnedPts.rating}
        reviewPts={earnedPts.review}
        bonusPts={earnedPts.bonus}
        notesPts={earnedPts.notes}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <h3 className="font-semibold">Write a Review</h3>

      {/* Overall rating */}
      <div className="rounded-lg border border-border p-4 text-center">
        <p className="mb-3 text-sm text-muted">Your overall rating</p>
        <div className="flex justify-center">
          <StarPicker value={overall} onChange={setOverall} size="text-4xl" />
        </div>
        {overall > 0 && (
          <p className="mt-2 text-sm font-medium text-accent">{RATING_LABELS[overall]}</p>
        )}
        <input type="hidden" name="rating" value={overall} />
      </div>

      {/* Main comment */}
      <div>
        <textarea
          name="textBody"
          required
          rows={5}
          placeholder="Tell others what you think — vibe, music, crowd, drinks…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <p className={`mt-1 text-xs ${bonusUnlocked ? "text-accent font-medium" : "text-muted"}`}>
          {bonusUnlocked ? "✓ Bonus unlocked! (+5 pts)" : `${charCount} / 200 chars · +5 pts when you hit 200`}
        </p>
      </div>

      {/* Sub-ratings */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted">More Details <span className="font-normal">(optional)</span></p>
        <div className="rounded-lg border border-border divide-y divide-border">
          {([
            ["Food", food, setFood],
            ["Service", service, setService],
            ["Atmosphere", atmosphere, setAtmosphere],
          ] as [string, number, (v: number) => void][]).map(([label, val, setter]) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <span className="w-24 text-sm text-muted">{label}</span>
              <StarPicker value={val} onChange={setter} size="text-lg" />
              <span className="ml-auto text-xs text-muted">{val > 0 ? `${val}/5` : "–"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Extra notes */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted">Extra Notes <span className="font-normal">(optional · +2 pts each)</span></p>
        <div className="flex flex-col gap-2">
          <textarea
            name="musicGenreNotes"
            rows={2}
            placeholder="Music genre notes — e.g. Deep house, live DJ until 4am"
            value={musicNotes}
            onChange={(e) => setMusicNotes(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <textarea
            name="priceLevelNotes"
            rows={2}
            placeholder="Price notes — e.g. ฿200 cover, cocktails ฿350"
            value={priceNotes}
            onChange={(e) => setPriceNotes(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <textarea
            name="crowdNotes"
            rows={2}
            placeholder="Crowd notes — e.g. Mixed expats and locals, 25–35 age range"
            value={crowdNotes}
            onChange={(e) => setCrowdNotes(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
      </div>

      {/* Live points preview */}
      {showPreview && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5 text-sm">
          <span className="font-bold text-accent">⚡ {totalPts} pts</span>
          <div className="flex flex-wrap gap-1 ml-1">
            {overall > 0 && <Pill>+1 ★</Pill>}
            {text.trim().length > 0 && <Pill>+10 review</Pill>}
            {bonusUnlocked && <Pill>+5 bonus</Pill>}
            {[musicNotes, priceNotes, crowdNotes].filter((n) => n.trim()).length > 0 && (
              <Pill>+{[musicNotes, priceNotes, crowdNotes].filter((n) => n.trim()).length * 2} notes</Pill>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || overall === 0}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-xs font-semibold bg-accent/15 text-accent">{children}</span>
  );
}
