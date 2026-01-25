"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ServiceProvider, useService } from "../../components/ServiceProvider";
import { FiringBoardAll } from "../../components/FiringBoardAll";
import { SeatSummary } from "../../components/SeatSummary";
import { TableVisualizer } from "../../components/TableVisualizer";
import { FiringBoard } from "../../components/FiringBoard";

const BOHScreen = () => {
  const { state, connected, updateStatus, sessionId, soundEnabled, toggleSound } = useService();
  const [visualMode, setVisualMode] = useState(false);
  const [overviewMode, setOverviewMode] = useState(false);

  const reservations = state?.reservations ?? [];
  const tables = state?.tables ?? [];
  const assignedReservations = useMemo(
    () => reservations.filter((reservation) => reservation.tableId),
    [reservations]
  );

  useEffect(() => {
    if (assignedReservations.length === 0) return;
  }, [assignedReservations]);

  if (!state) {
    return <div className="p-10 text-white/60">Connecting to service state...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">BOH Live View</p>
          <h1 className="text-3xl font-serif">Course & Fire Control</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg border border-white/20 text-white/70 hover:border-white/40"
          >
            Back to setup
          </Link>
          <button
            type="button"
            onClick={toggleSound}
            className={`px-3 py-2 rounded-lg border ${soundEnabled ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
          >
            Sound {soundEnabled ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={() => setOverviewMode((prev) => !prev)}
            className={`px-3 py-2 rounded-lg border ${overviewMode ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
          >
            {overviewMode ? "All tables on" : "All tables off"}
          </button>
          <button
            type="button"
            onClick={() => setVisualMode((prev) => !prev)}
            className={`px-3 py-2 rounded-lg border ${visualMode ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
          >
            {visualMode ? "Table view on" : "Table view off"}
          </button>
          <span className={`text-xs px-2 py-1 rounded-full ${connected ? "bg-sage text-ink" : "bg-garnet text-bone"}`}>
            {connected ? "Live" : "Offline"}
          </span>
          <span className="text-xs px-2 py-1 rounded-full border border-white/10 text-white/70">
            {sessionId === "training" ? "Training" : "Service"}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <section className="space-y-4">
          {overviewMode ? (
            <FiringBoardAll
              reservations={reservations}
              tables={tables}
              statuses={state.statuses}
              timeline={state.timeline}
              onUpdateStatus={(status) => updateStatus({ status })}
              role="BOH"
              className="grid gap-4 md:grid-cols-2"
              showTableVisualization={visualMode}
            />
          ) : visualMode ? (
            <div className="grid gap-4">
              {assignedReservations.map((reservation) => {
                const table = tables.find((item) => item.id === reservation.tableId);
                if (!table) return null;
                return (
                  <FiringBoard
                    key={table.id}
                    table={table}
                    statuses={state.statuses}
                    timeline={state.timeline}
                    onUpdateStatus={(status) => updateStatus({ status })}
                    role="BOH"
                    excludedCourses={reservation.excludedCourses ?? []}
                    headerContent={
                      <TableVisualizer
                        reservation={reservation}
                        table={table}
                        statuses={state.statuses}
                        variant="plain"
                        showSeatDetails
                      />
                    }
                  />
                );
              })}
            </div>
          ) : (
            <FiringBoardAll
              reservations={reservations}
              tables={tables}
              statuses={state.statuses}
              timeline={state.timeline}
              onUpdateStatus={(status) => updateStatus({ status })}
              role="BOH"
            />
          )}
        </section>

        <section className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif">Seat alerts</h2>
            <span className="text-xs text-white/60">{assignedReservations.length} tables</span>
          </div>
          <div className="mt-4 space-y-3 max-h-[70vh] overflow-auto subtle-scroll">
            {assignedReservations.map((reservation) => {
              const table = tables.find((item) => item.id === reservation.tableId);
              if (!table) return null;
              return <SeatSummary key={reservation.id} reservation={reservation} table={table} />;
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default function BOHPage({ searchParams }: { searchParams?: { session?: string } }) {
  const sessionId = searchParams?.session ?? "live";
  return (
    <ServiceProvider role="BOH" sessionId={sessionId}>
      <BOHScreen />
    </ServiceProvider>
  );
}
