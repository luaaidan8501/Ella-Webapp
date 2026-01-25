"use client";

import type { Reservation, Table } from "../lib/types";

export const SeatSummary = ({ reservation, table }: { reservation: Reservation; table: Table }) => {
  const allergySeats = reservation.seats.filter((seat) => seat.allergyNotes.trim().length > 0);
  const lateSeats = reservation.seats.filter((seat) => seat.lateStatus !== "on-time");
  const cocktailCount = reservation.seats.filter((seat) => seat.drinkPreference === "cocktail").length;
  const mocktailCount = reservation.seats.filter((seat) => seat.drinkPreference === "mocktail").length;
  const seatSkips = reservation.seats.filter(
    (seat) => (seat.excludedCourses?.length ?? 0) > 0 || (seat.excludedDrinks?.length ?? 0) > 0
  );

  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">{table.name}</p>
          <p className="text-lg font-serif">{reservation.guestName}</p>
        </div>
        <span className="text-xs text-white/60">{reservation.seats.length} seats</span>
      </div>
      <div className="mt-3 text-xs text-white/70 space-y-1">
        <p>Allergies: {allergySeats.length === 0 ? "None" : allergySeats.map((seat) => `#${seat.seatNumber} ${seat.allergyNotes}`).join(", ")}</p>
        <p>Late/Arrived: {lateSeats.length === 0 ? "All on time" : lateSeats.map((seat) => `#${seat.seatNumber} ${seat.lateStatus}`).join(", ")}</p>
        <p>Drinks: Cocktail {cocktailCount} · Mocktail {mocktailCount}</p>
        <p>
          Seat skips: {seatSkips.length === 0
            ? "None"
            : seatSkips
                .map((seat) => `#${seat.seatNumber} ${[...(seat.excludedCourses ?? []).map((c) => `C${c}`), ...(seat.excludedDrinks ?? []).map((d) => `D${d}`)].join("/")}`)
                .join(", ")}
        </p>
      </div>
    </div>
  );
};
