"use client";

import type { Seat } from "../lib/types";

const lateCycle: Seat["lateStatus"][] = ["on-time", "late", "arrived"];
const drinkCycle: Seat["drinkPreference"][] = ["none", "cocktail", "mocktail"];

const badgeForLate = (status: Seat["lateStatus"]) => {
  if (status === "late") return "bg-garnet text-bone";
  if (status === "arrived") return "bg-sage text-ink";
  return "bg-white/10 text-white/60";
};

export const SeatTile = ({
  seat,
  onUpdate,
  onPositionChange,
  maxPositions = 6,
  readOnly = false
}: {
  seat: Seat;
  onUpdate: (seat: Seat) => void;
  onPositionChange?: (position: number) => void;
  maxPositions?: number;
  readOnly?: boolean;
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

  return (
    <div className="rounded-xl border border-white/10 p-3 bg-white/5">
      <div className="flex items-center justify-between">
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
      {onPositionChange && !readOnly && (
        <div className="mt-3">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Position</label>
          <select
            value={seat.seatNumber}
            onChange={(event) => onPositionChange(Number(event.target.value))}
            className="mt-1 w-full bg-black/40 border border-white/10 rounded-md px-2 py-1 text-sm"
          >
            {Array.from({ length: maxPositions }, (_, index) => (
              <option key={`pos-${index + 1}`} value={index + 1}>
                Position {index + 1}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
