import type { NationalAllocation } from "./national";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export type TimetableSlot = {
  /** 1 = Monday ... 5 = Friday */
  day: number;
  /** 1-based period within the day */
  period: number;
  allocationId: string;
};

export type TimetableCheck = {
  id: string;
  label: string;
  status: "pass" | "fail" | "pending";
  detail?: string;
};

export type TimetableValidation = {
  /** allocation id -> periods placed */
  placed: Record<string, number>;
  totalPlaced: number;
  totalRequired: number;
  checks: TimetableCheck[];
  canPublish: boolean;
};

const slotKey = (day: number, period: number) => `${day}:${period}`;

/**
 * Checks a weekly timetable against the national period allocation and the
 * layout rules that come with it (a period must directly follow another;
 * some lessons come as double lessons). Pure, so the editor and the server
 * action apply exactly the same rules.
 */
export function validateTimetable(
  allocations: NationalAllocation[],
  slots: TimetableSlot[],
): TimetableValidation {
  const grid = new Map<string, string>();
  const placed: Record<string, number> = {};
  for (const a of allocations) placed[a.id] = 0;
  for (const s of slots) {
    grid.set(slotKey(s.day, s.period), s.allocationId);
    if (s.allocationId in placed) placed[s.allocationId] += 1;
  }

  const totalRequired = allocations.reduce((sum, a) => sum + a.periods, 0);
  const totalPlaced = allocations.reduce(
    (sum, a) => sum + Math.min(placed[a.id] ?? 0, a.periods),
    0,
  );

  const checks: TimetableCheck[] = [];
  const byKey = new Map(allocations.map((a) => [a.key, a]));

  // "X directly follows Y": every X period sits right after a Y period, and
  // every Y period is followed by an X period.
  for (const a of allocations) {
    if (!a.follows_key) continue;
    const first = byKey.get(a.follows_key);
    if (!first) continue;
    const id = `follows-${a.key}`;
    const label = `${first.label} and ${a.label} follow one another`;
    if ((placed[a.id] ?? 0) === 0 && (placed[first.id] ?? 0) === 0) {
      checks.push({ id, label, status: "pending", detail: "Not placed yet" });
      continue;
    }
    let broken = 0;
    for (const s of slots) {
      if (s.allocationId === a.id && grid.get(slotKey(s.day, s.period - 1)) !== first.id) {
        broken += 1;
      }
      if (s.allocationId === first.id && grid.get(slotKey(s.day, s.period + 1)) !== a.id) {
        broken += 1;
      }
    }
    checks.push(
      broken === 0
        ? { id, label, status: "pass" }
        : {
            id,
            label,
            status: "fail",
            detail: `${broken} period${broken === 1 ? "" : "s"} not paired`,
          },
    );
  }

  // Block lessons (e.g. a double lesson): consecutive runs must be whole blocks.
  for (const a of allocations) {
    if (a.block_size <= 1) continue;
    const id = `block-${a.key}`;
    const label =
      a.block_size === 2
        ? `${a.label} is a double lesson`
        : `${a.label} comes in blocks of ${a.block_size} periods`;
    if ((placed[a.id] ?? 0) === 0) {
      checks.push({ id, label, status: "pending", detail: "Not placed yet" });
      continue;
    }
    let ok = true;
    for (let day = 1; day <= DAYS.length && ok; day += 1) {
      const periods = slots
        .filter((s) => s.day === day && s.allocationId === a.id)
        .map((s) => s.period)
        .sort((x, y) => x - y);
      let run = 0;
      for (let i = 0; i < periods.length; i += 1) {
        run = i > 0 && periods[i] === periods[i - 1] + 1 ? run + 1 : 1;
        const endsRun = i === periods.length - 1 || periods[i + 1] !== periods[i] + 1;
        if (endsRun && run % a.block_size !== 0) ok = false;
      }
    }
    checks.push(
      ok
        ? { id, label, status: "pass" }
        : { id, label, status: "fail", detail: "Periods must sit together" },
    );
  }

  const shortfalls = allocations.filter((a) => (placed[a.id] ?? 0) !== a.periods);
  checks.unshift({
    id: "total",
    label: `${totalPlaced} of ${totalRequired} required periods placed`,
    status: shortfalls.length === 0 ? "pass" : "fail",
    detail:
      shortfalls.length === 0
        ? undefined
        : shortfalls
            .map((a) => `${a.label} ${placed[a.id] ?? 0}/${a.periods}`)
            .join(", "),
  });

  return {
    placed,
    totalPlaced,
    totalRequired,
    checks,
    canPublish: checks.every((c) => c.status === "pass"),
  };
}
