"use client";

import type { ServiceStatus, ServiceStatusType, Table, TimelineEvent, Role } from "../lib/types";
import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";

const statusCycle: ServiceStatusType[] = ["STANDBY", "PLATE_UP", "PICK_UP", "SERVED"];

const courseNames = ["C1", "C2", "C3", "C4", "C5", "C6"];
const drinkNames = ["D1", "D2"];

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getNextStatus = (current: ServiceStatusType) => {
  const index = statusCycle.indexOf(current);
  return statusCycle[(index + 1) % statusCycle.length];
};

const getStatusKey = (status: ServiceStatus) => `${status.tableId}:${status.courseIndex ?? ""}:${status.drinkIndex ?? ""}`;

export const FiringBoard = ({
  table,
  statuses,
  timeline,
  onUpdateStatus,
  role,
  excludedCourses = [],
  headerContent,
  showTimeline = true
}: {
  table: Table | null;
  statuses: ServiceStatus[];
  timeline: TimelineEvent[];
  onUpdateStatus: (status: ServiceStatus) => void;
  role: Role;
  excludedCourses?: number[];
  headerContent?: ReactNode;
  showTimeline?: boolean;
}) => {
  if (!table) {
    return (
      <div className="card p-6 h-full flex items-center justify-center text-white/60">
        Select a table to view the firing board.
      </div>
    );
  }

  const tableStatuses = statuses.filter((status) => status.tableId === table.id);
  const statusMap = new Map(tableStatuses.map((status) => [getStatusKey(status), status]));

  const handleAdvance = (kind: "course" | "drink", index: number) => {
    const key = `${table.id}:${kind === "course" ? index : ""}:${kind === "drink" ? index : ""}`;
    const current = statusMap.get(key);
    const next = getNextStatus(current?.status ?? "STANDBY");
    onUpdateStatus({
      tableId: table.id,
      courseIndex: kind === "course" ? index : undefined,
      drinkIndex: kind === "drink" ? index : undefined,
      status: next,
      updatedBy: role,
      updatedAt: Date.now()
    });
  };

  const tableTimeline = timeline.filter((event) => event.tableId === table.id).slice(0, 6);

  return (
    <div className="card p-5 flex flex-col gap-5 h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {headerContent ?? (
            <>
              <p className="text-white/60 text-xs uppercase tracking-[0.2em]">Firing board</p>
              <h2 className="text-2xl font-serif">{table.name}</h2>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Statuses update live</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Courses</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, index) => {
              const item = index + 1;
              const key = `${table.id}:${item}:`;
              const current = statusMap.get(key);
              const status = current?.status ?? "STANDBY";
              const meta = current ? `${current.updatedBy} · ${formatTime(current.updatedAt)}` : "—";
              const isExcluded = excludedCourses.includes(item);
              return (
                <button
                  key={`course-${item}`}
                  type="button"
                  onClick={() => handleAdvance("course", item)}
                  className={`rounded-xl border p-2 transition ${
                    isExcluded
                      ? "border-garnet/70 text-garnet bg-garnet/10"
                      : "border-white/10 hover:border-brass/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{courseNames[item - 1]}</span>
                    <StatusBadge status={status} />
                  </div>
                  {isExcluded && <div className="mt-1 text-[10px] uppercase tracking-[0.2em]">Skip</div>}
                  <div className="mt-1 text-[9px] text-white/50 uppercase tracking-[0.2em]">{meta}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Drinks</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Array.from({ length: 2 }, (_, index) => {
              const item = index + 1;
              const key = `${table.id}::${item}`;
              const current = statusMap.get(key);
              const status = current?.status ?? "STANDBY";
              const meta = current ? `${current.updatedBy} · ${formatTime(current.updatedAt)}` : "—";
              return (
                <button
                  key={`drink-${item}`}
                  type="button"
                  onClick={() => handleAdvance("drink", item)}
                  className="rounded-xl border border-white/10 p-2 hover:border-sage/70 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{drinkNames[item - 1]}</span>
                    <StatusBadge status={status} />
                  </div>
                  <div className="mt-1 text-[9px] text-white/50 uppercase tracking-[0.2em]">{meta}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showTimeline && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Service timeline</p>
          <div className="mt-3 space-y-2 max-h-32 overflow-auto subtle-scroll">
            {tableTimeline.length === 0 ? (
              <p className="text-white/40 text-sm">No events yet.</p>
            ) : (
              tableTimeline.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <span>{event.message}</span>
                  <span className="text-white/50 text-xs">{event.createdBy} · {formatTime(event.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
