"use client";

import type { Reservation, Role, ServiceStatus, Table, TimelineEvent } from "../lib/types";
import { FiringBoard } from "./FiringBoard";
import { TableVisualizer } from "./TableVisualizer";

export const FiringBoardAll = ({
  reservations,
  tables,
  statuses,
  timeline,
  onUpdateStatus,
  role,
  className,
  showSeatDetails = false,
  showTimeline = true
}: {
  reservations: Reservation[];
  tables: Table[];
  statuses: ServiceStatus[];
  timeline: TimelineEvent[];
  onUpdateStatus: (status: ServiceStatus) => void;
  role: Role;
  className?: string;
  showSeatDetails?: boolean;
  showTimeline?: boolean;
}) => {
  const activeTables = reservations
    .filter((reservation) => reservation.tableId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((reservation) => tables.find((table) => table.id === reservation.tableId))
    .filter((table): table is Table => Boolean(table));

  if (activeTables.length === 0) {
    return <div className="card p-6 text-white/60">No active tables assigned.</div>;
  }

  return (
    <div className={className ?? "grid gap-4"}>
      {activeTables.map((table) => {
        const reservation = reservations.find((item) => item.tableId === table.id);
        return (
          <FiringBoard
            key={table.id}
            table={table}
            statuses={statuses}
            timeline={timeline}
            onUpdateStatus={onUpdateStatus}
            role={role}
            excludedCourses={reservation?.excludedCourses ?? []}
            showTimeline={showTimeline}
            headerContent={
              showSeatDetails && reservation
                ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Table</p>
                        <p className="text-lg font-serif">{table.name}</p>
                      </div>
                      <span className="text-xs text-white/60">Cap {table.capacity}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {reservation.seats
                        .sort((a, b) => a.seatNumber - b.seatNumber)
                        .map((seat) => (
                          <div key={`seat-detail-${seat.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono">Seat {seat.seatNumber}</span>
                              <span className={`text-[10px] uppercase tracking-[0.2em] ${
                                seat.lateStatus === "late"
                                  ? "text-garnet"
                                  : seat.lateStatus === "arrived"
                                    ? "text-sage"
                                    : "text-white/60"
                              }`}>
                                {seat.lateStatus}
                              </span>
                            </div>
                            <div className="mt-2 text-white/60 space-y-1">
                              <div>Allergy: {seat.allergyNotes.trim() ? seat.allergyNotes : "None"}</div>
                              <div>Drink pref: {seat.drinkPreference}</div>
                              <div>
                                Skip: {(seat.excludedCourses?.length ?? 0) || (seat.excludedDrinks?.length ?? 0)
                                  ? [
                                      ...(seat.excludedCourses ?? []).map((course) => `C${course}`),
                                      ...(seat.excludedDrinks ?? []).map((drink) => `D${drink}`)
                                    ].join(", ")
                                  : "None"}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )
                : undefined
            }
          />
        );
      })}
    </div>
  );
};
