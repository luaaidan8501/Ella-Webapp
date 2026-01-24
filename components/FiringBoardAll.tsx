"use client";

import type { Reservation, Role, ServiceStatus, Table, TimelineEvent } from "../lib/types";
import { FiringBoard } from "./FiringBoard";

export const FiringBoardAll = ({
  reservations,
  tables,
  statuses,
  timeline,
  onUpdateStatus,
  role
}: {
  reservations: Reservation[];
  tables: Table[];
  statuses: ServiceStatus[];
  timeline: TimelineEvent[];
  onUpdateStatus: (status: ServiceStatus) => void;
  role: Role;
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
    <div className="grid gap-4">
      {activeTables.map((table) => (
        // Find reservation assigned to this table for course exclusions.
        <FiringBoard
          key={table.id}
          table={table}
          statuses={statuses}
          timeline={timeline}
          onUpdateStatus={onUpdateStatus}
          role={role}
          excludedCourses={reservations.find((reservation) => reservation.tableId === table.id)?.excludedCourses ?? []}
        />
      ))}
    </div>
  );
};
