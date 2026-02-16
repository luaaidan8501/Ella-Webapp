"use client";

import type { Seat } from "../lib/types";

const lateCycle: Seat["lateStatus"][] = ["on-time", "late", "arrived"];
const drinkCycle: Seat["drinkPreference"][] = ["none", "cocktail", "mocktail"];
const drinkLabels = ["D1", "D2", "D3"];

const badgeForLate = (status: Seat["lateStatus"]) => {
  if (status === "late") return "bg-garnet text-bone";
  if (status === "arrived") return "bg-sage text-ink";
  return "bg-white/10 text-white/60";
};

export const SeatTile = ({
  seat,
  onUpdate,
  readOnly = false,
  compact = false
}: {
  seat: Seat;
  onUpdate: (seat: Seat) => void;
  readOnly?: boolean;
  compact?: boolean;
}) => {
  const handleLateToggle = () => {
    if (readOnly) return;
    const index = lateCycle.indexOf(seat.lateStatus);
    const next = lateCycle[(index + 1) % lateCycle.length];
    onUpdate({ ...seat, lateStatus: next });
  };

  const handleDrinkToggle = () => {
    if (readOnly) return;
    const index = drinkCycle.indexOf(seat.drinkPreference);
    const next = drinkCycle[(index + 1) % drinkCycle.length];
    onUpdate({ ...seat, drinkPreference: next });
  };

  const toggleExcludedCourse = (courseIndex: number) => {
    if (readOnly) return;
    const current = seat.excludedCourses ?? [];
    const excludedCourses = current.includes(courseIndex)
      ? current.filter((item) => item !== courseIndex)
      : [...current, courseIndex];
    onUpdate({ ...seat, excludedCourses });
  };

  const toggleExcludedDrink = (drinkIndex: number) => {
    if (readOnly) return;
    const current = seat.excludedDrinks ?? [];
    const excludedDrinks = current.includes(drinkIndex)
      ? current.filter((item) => item !== drinkIndex)
      : [...current, drinkIndex];
    onUpdate({ ...seat, excludedDrinks });
  };

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 ${compact ? "p-2" : "p-3"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-mono">Seat {seat.seatNumber}</p>
        <button
          type="button"
          onClick={handleLateToggle}
          disabled={readOnly}
          className={`text-xs px-3 py-1 rounded-full border border-white/20 shadow-sm hover:border-white/40 disabled:opacity-60 disabled:cursor-not-allowed ${badgeForLate(seat.lateStatus)}`}
        >
          {seat.lateStatus}
        </button>
      </div>
      {compact ? null : (
        <>
      <div className="mt-3">
        <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Allergy</label>
        <input
          value={seat.allergyNotes}
          onChange={(event) => {
            if (readOnly) return;
            onUpdate({ ...seat, allergyNotes: event.target.value });
          }}
          readOnly={readOnly}
          placeholder="None"
          className="mt-1 w-full bg-black/40 border border-white/10 rounded-md px-2 py-1 text-sm disabled:opacity-60"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Drink</span>
        <button
          type="button"
          onClick={handleDrinkToggle}
          disabled={readOnly}
          className="text-xs px-2 py-1 rounded-full border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {seat.drinkPreference}
        </button>
      </div>
      <div className="mt-3">
        <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Skip food courses</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, index) => {
            const course = index + 1;
            const selected = (seat.excludedCourses ?? []).includes(course);
            return (
              <button
                key={`seat-course-${seat.id}-${course}`}
                type="button"
                onClick={() => toggleExcludedCourse(course)}
                disabled={readOnly}
                className={`text-[10px] px-2 py-1 rounded-md border ${
                  selected ? "border-garnet text-garnet" : "border-white/10 text-white/70"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                C{course}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3">
        <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Skip drinks</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {drinkLabels.map((label, index) => {
            const drinkIndex = index + 1;
            const selected = (seat.excludedDrinks ?? []).includes(drinkIndex);
            return (
              <button
                key={`seat-drink-${seat.id}-${drinkIndex}`}
                type="button"
                onClick={() => toggleExcludedDrink(drinkIndex)}
                disabled={readOnly}
                className={`text-[10px] px-2 py-1 rounded-md border ${
                  selected ? "border-garnet text-garnet" : "border-white/10 text-white/70"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
