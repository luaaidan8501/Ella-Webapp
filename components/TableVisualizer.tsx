"use client";

import { useMemo } from "react";
import type { Reservation, ServiceStatus, ServiceStatusType, Table } from "../lib/types";

const badgeForLate = (status: Reservation["seats"][number]["lateStatus"]) => {
  if (status === "late") return "bg-garnet text-bone";
  if (status === "arrived") return "bg-sage text-ink";
  return "bg-white/10 text-white/60";
};

const shapeStyles: Record<Reservation["tableShape"], { radius: number; label: string; size: { w: number; h: number } }> = {
  square: { radius: 10, label: "Square", size: { w: 120, h: 120 } },
  round: { radius: 999, label: "Round", size: { w: 120, h: 120 } },
  oval: { radius: 999, label: "Oval", size: { w: 170, h: 100 } },
  banquette: { radius: 28, label: "Banquette", size: { w: 180, h: 95 } },
  counter: { radius: 18, label: "Counter", size: { w: 200, h: 70 } }
};

export const TableVisualizer = ({
  reservation,
  table,
  statuses,
  variant = "card",
  showSeatDetails = false
}: {
  reservation: Reservation;
  table: Table | null;
  statuses?: ServiceStatus[];
  variant?: "card" | "plain";
  showSeatDetails?: boolean;
}) => {
  const orderedSeats = [...reservation.seats].sort((a, b) => a.seatNumber - b.seatNumber);
  const radius = 92;
  const center = 120;
  const shape = shapeStyles[reservation.tableShape ?? "square"] ?? shapeStyles.square;

  const layoutArc = reservation.tableShape === "banquette" || reservation.tableShape === "counter";
  const startAngle = layoutArc ? Math.PI * 1.05 : -Math.PI / 2;
  const endAngle = layoutArc ? Math.PI * 1.95 : Math.PI * 1.5;

  const snapPoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const maxSeats = 6;
    if (layoutArc) {
      const step = (endAngle - startAngle) / (maxSeats - 1);
      for (let i = 0; i < maxSeats; i += 1) {
        const angle = startAngle + step * i;
        points.push({ x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) });
      }
    } else {
      const step = (Math.PI * 2) / maxSeats;
      for (let i = 0; i < maxSeats; i += 1) {
        const angle = -Math.PI / 2 + step * i;
        points.push({ x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) });
      }
    }
    return points;
  }, [layoutArc, center, radius, startAngle, endAngle]);

  const currentCourse = useMemo(() => {
    if (!table || !statuses) return null;
    const courseStatuses = statuses
      .filter((status) => status.tableId === table.id && status.courseIndex)
      .sort((a, b) => (a.courseIndex ?? 0) - (b.courseIndex ?? 0));
    if (courseStatuses.length === 0) return null;
    const next = courseStatuses.find((status) => status.status !== "SERVED");
    return next ?? courseStatuses[courseStatuses.length - 1];
  }, [table, statuses]);

  const courseBadge = (status?: ServiceStatusType) => {
    if (!status) return "bg-white/10 text-white/60";
    if (status === "PLATE_UP") return "bg-brass/80 text-ink";
    if (status === "PICK_UP") return "bg-sage/80 text-ink";
    if (status === "SERVED") return "bg-white text-ink";
    return "bg-white/10 text-white/60";
  };

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Table layout</p>
          <p className="text-lg font-serif">{table ? table.name : "Unassigned"}</p>
        </div>
        {table && <span className="text-xs text-white/60">Cap {table.capacity}</span>}
      </div>
      <p className="text-xs text-white/50 mt-1">{shape.label} layout · positions 1-6</p>
      <div className="mt-4 flex items-center justify-center">
        <div className="relative" style={{ width: 240, height: 240 }}>
          <div
            className="absolute border border-brass/50 bg-brass/10"
            style={{
              width: shape.size.w,
              height: shape.size.h,
              left: center - shape.size.w / 2,
              top: center - shape.size.h / 2,
              borderRadius: shape.radius
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-xs text-brass/80 uppercase tracking-[0.2em]">
              {table ? table.name : "TBD"}
            </div>
          </div>
          {orderedSeats.map((seat) => {
            const clampedIndex = Math.max(0, Math.min(5, seat.seatNumber - 1));
            const snapPoint = snapPoints[clampedIndex];
            const x = snapPoint.x;
            const y = snapPoint.y;
            return (
              <div
                key={seat.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 px-2 py-1 text-[10px] ${badgeForLate(seat.lateStatus)}`}
                style={{ left: x, top: y }}
              >
                <div className="flex items-center gap-1">
                  <span>Pos {seat.seatNumber}</span>
                  {seat.allergyNotes.trim() ? <span className="text-garnet">!</span> : null}
                  {seat.drinkPreference === "cocktail" && <span className="text-brass">C</span>}
                  {seat.drinkPreference === "mocktail" && <span className="text-sage">M</span>}
                </div>
                {currentCourse?.courseIndex ? (
                  <div className={`mt-1 rounded-full px-1 py-0.5 text-[9px] uppercase tracking-[0.2em] ${courseBadge(currentCourse.status)}`}>
                    C{currentCourse.courseIndex}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {showSeatDetails && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {orderedSeats.map((seat) => (
            <div key={`seat-detail-${seat.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-mono">Pos {seat.seatNumber}</span>
                <span className={`text-[10px] uppercase tracking-[0.2em] ${badgeForLate(seat.lateStatus)}`}>
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
      )}
    </>
  );

  if (variant === "plain") {
    return content;
  }

  return <div className="rounded-2xl border border-white/10 bg-black/30 p-4">{content}</div>;
};
