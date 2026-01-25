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
  showTableVisualization = false,
  showSeatDetails = false
}: {
  reservations: Reservation[];
  tables: Table[];
  statuses: ServiceStatus[];
  timeline: TimelineEvent[];
  onUpdateStatus: (status: ServiceStatus) => void;
  role: Role;
  className?: string;
  showTableVisualization?: boolean;
  showSeatDetails?: boolean;
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
            headerContent={
              showTableVisualization && reservation
                ? (
                  <TableVisualizer
                    reservation={reservation}
                    table={table}
                    statuses={statuses}
                    variant="plain"
                    showSeatDetails={showSeatDetails}
                  />
                )
                : undefined
            }
          />
        );
      })}
    </div>
  );
};
