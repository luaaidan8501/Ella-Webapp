"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ServiceProvider, useService } from "../../components/ServiceProvider";
import { ReservationModal } from "../../components/ReservationModal";
import { SeatTile } from "../../components/SeatTile";
import { TableVisualizer } from "../../components/TableVisualizer";
import { FiringBoard } from "../../components/FiringBoard";
import { FiringBoardAll } from "../../components/FiringBoardAll";
import type { Reservation, Table } from "../../lib/types";

const FOHScreen = () => {
  const {
    state,
    connected,
    createReservation,
    updateReservation,
    assignTable,
    updateSeat,
    updateSeatCount,
    updateStatus,
    resetService,
    sessionId,
    soundEnabled,
    toggleSound
  } = useService();
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [overviewMode, setOverviewMode] = useState(false);
  const [collapseSeatOptions, setCollapseSeatOptions] = useState(true);
  const [collapseTimeline, setCollapseTimeline] = useState(true);
  const [collapseTableDetails, setCollapseTableDetails] = useState(true);

  const reservations = useMemo(() => {
    if (!state) return [];
    return [...state.reservations].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [state]);

  const tables = state?.tables ?? [];

  useEffect(() => {
    if (!state) return;
    if (!selectedReservationId || !state.reservations.some((res) => res.id === selectedReservationId)) {
      setSelectedReservationId(state.reservations[0]?.id ?? null);
    }
  }, [state, selectedReservationId]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!state) return;
      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        const index = reservations.findIndex((res) => res.id === selectedReservationId);
        const next = reservations[index + 1] ?? reservations[0];
        if (next) setSelectedReservationId(next.id);
      }
      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        const index = reservations.findIndex((res) => res.id === selectedReservationId);
        const prev = reservations[index - 1] ?? reservations[reservations.length - 1];
        if (prev) setSelectedReservationId(prev.id);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [reservations, selectedReservationId, state]);

  const selectedReservation = reservations.find((res) => res.id === selectedReservationId) ?? null;
  const selectedTable = tables.find((table) => table.id === selectedReservation?.tableId) ?? null;
  const capacity = selectedTable?.capacity ?? null;
  const overCapacity = capacity !== null && selectedReservation && selectedReservation.seats.length > capacity;
  const maxPositions = 6;

  const handleSeatPositionChange = (seatId: string, targetPosition: number) => {
    if (!selectedReservation) return;
    const seats = selectedReservation.seats;
    const seat = seats.find((item) => item.id === seatId);
    if (!seat || seat.seatNumber === targetPosition) return;

    const positions = Array.from({ length: maxPositions }, (_, index) =>
      seats.find((item) => item.seatNumber === index + 1) ?? null
    );
    const currentIndex = seat.seatNumber - 1;
    const targetIndex = targetPosition - 1;
    positions[currentIndex] = null;

    if (!positions[targetIndex]) {
      positions[targetIndex] = seat;
    } else {
      let emptyIndex = currentIndex;
      const prevIndex = (index: number) => (index - 1 + maxPositions) % maxPositions;
      while (emptyIndex !== targetIndex) {
        const fromIndex = prevIndex(emptyIndex);
        positions[emptyIndex] = positions[fromIndex];
        positions[fromIndex] = null;
        emptyIndex = fromIndex;
      }
      positions[targetIndex] = seat;
    }

    positions.forEach((item, index) => {
      if (!item) return;
      const newSeatNumber = index + 1;
      if (item.seatNumber !== newSeatNumber) {
        updateSeat({ reservationId: selectedReservation.id, seat: { ...item, seatNumber: newSeatNumber } });
      }
    });
  };

  if (!state) {
    return <div className="p-10 text-white/60">Connecting to service state...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">FOH Live View</p>
          <h1 className="text-3xl font-serif">Ella Service Sync</h1>
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
            onClick={() => setOverviewMode((prev) => !prev)}
            className={`px-3 py-2 rounded-lg border ${overviewMode ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
          >
            {overviewMode ? "All tables on" : "All tables off"}
          </button>
          {overviewMode && (
            <>
              <button
                type="button"
                onClick={() => setCollapseSeatOptions((prev) => !prev)}
                className={`px-3 py-2 rounded-lg border ${collapseSeatOptions ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
              >
                Seat options {collapseSeatOptions ? "collapsed" : "open"}
              </button>
              <button
                type="button"
                onClick={() => setCollapseTableDetails((prev) => !prev)}
                className={`px-3 py-2 rounded-lg border ${collapseTableDetails ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
              >
                Table details {collapseTableDetails ? "collapsed" : "open"}
              </button>
              <button
                type="button"
                onClick={() => setCollapseTimeline((prev) => !prev)}
                className={`px-3 py-2 rounded-lg border ${collapseTimeline ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
              >
                Timeline {collapseTimeline ? "collapsed" : "open"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleSound}
            className={`px-3 py-2 rounded-lg border ${soundEnabled ? "border-brass text-brass" : "border-white/20 text-white/70"}`}
          >
            Sound {soundEnabled ? "on" : "off"}
          </button>
          <span className={`text-xs px-2 py-1 rounded-full ${connected ? "bg-sage text-ink" : "bg-garnet text-bone"}`}>
            {connected ? "Live" : "Offline"}
          </span>
          <span className="text-xs px-2 py-1 rounded-full border border-white/10 text-white/70">
            {sessionId === "training" ? "Training" : "Service"}
          </span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-brass text-ink font-semibold"
          >
            New reservation
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset service state and reload seed data?")) {
                resetService({ requestedBy: "FOH" });
              }
            }}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/70"
          >
            Reset service
          </button>
        </div>
      </header>

      {overviewMode ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {reservations.map((reservation) => {
            const table = tables.find((item) => item.id === reservation.tableId) ?? null;
            const tableCapacity = table?.capacity ?? null;
            const tooManySeats = tableCapacity !== null && reservation.seats.length > tableCapacity;
            return (
              <div key={reservation.id} className="card p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Table</p>
                    <h2 className="text-lg font-serif">{reservation.guestName}</h2>
                    <p className="text-xs text-white/60">Party {reservation.partySize} · {reservation.seats.length} seats</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReservation(reservation);
                      setIsModalOpen(true);
                    }}
                    className="text-xs px-3 py-2 rounded-full border border-white/10"
                  >
                    Edit
                  </button>
                </div>
                {!collapseTableDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">Table assignment</label>
                      <select
                        value={reservation.tableId ?? ""}
                        onChange={(event) => assignTable({ reservationId: reservation.id, tableId: event.target.value || null })}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                      >
                        <option value="">Unassigned</option>
                        {tables.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · cap {item.capacity}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">Table shape</label>
                      <select
                        value={reservation.tableShape ?? "square"}
                        onChange={(event) => updateReservation({ id: reservation.id, tableShape: event.target.value as Reservation["tableShape"] })}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                      >
                        <option value="square">Square</option>
                        <option value="round">Round</option>
                        <option value="oval">Oval</option>
                        <option value="banquette">Banquette</option>
                        <option value="counter">Counter</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">Notes</label>
                      <input
                        value={reservation.notes}
                        onChange={(event) => updateReservation({ id: reservation.id, notes: event.target.value })}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                        placeholder="Service notes"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSeatCount({ reservationId: reservation.id, count: reservation.seats.length - 1 })}
                    disabled={reservation.seats.length <= 1}
                    className="px-2 py-1 rounded-md border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="text-sm">{reservation.seats.length} seats</span>
                  <button
                    type="button"
                    onClick={() => updateSeatCount({ reservationId: reservation.id, count: reservation.seats.length + 1 })}
                    disabled={reservation.seats.length >= 6}
                    className="px-2 py-1 rounded-md border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                {tooManySeats && (
                  <div className="rounded-xl border border-garnet/60 bg-garnet/20 p-3 text-sm">
                    Seat count exceeds table capacity ({tableCapacity}). Consider reassigning or splitting.
                  </div>
                )}
                <TableVisualizer reservation={reservation} table={table} statuses={state.statuses} showSeatDetails />
                {!collapseSeatOptions ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 subtle-scroll">
                    {reservation.seats.map((seat) => (
                      <div key={seat.id} className="min-w-[240px]">
                        <SeatTile
                          seat={seat}
                          onUpdate={(updatedSeat) => updateSeat({ reservationId: reservation.id, seat: updatedSeat })}
                          onPositionChange={(position) => handleSeatPositionChange(seat.id, position)}
                          maxPositions={maxPositions}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2 subtle-scroll">
                    {reservation.seats.map((seat) => (
                      <div key={seat.id} className="min-w-[140px]">
                        <SeatTile
                          seat={seat}
                          compact
                          onUpdate={(updatedSeat) => updateSeat({ reservationId: reservation.id, seat: updatedSeat })}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {table ? (
                  <FiringBoard
                    table={table}
                    statuses={state.statuses}
                    timeline={state.timeline}
                    onUpdateStatus={(status) => updateStatus({ status })}
                    role="FOH"
                    excludedCourses={reservation.excludedCourses ?? []}
                    showTimeline={!collapseTimeline}
                  />
                ) : (
                  <div className="text-white/60 text-sm">Assign a table to view firing status.</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.3fr_1.1fr] gap-6">
        <section className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif">Reservations</h2>
            <span className="text-xs text-white/60">{reservations.length} active</span>
          </div>
          <div className="space-y-2 overflow-auto subtle-scroll max-h-[70vh]">
            {reservations.map((reservation, index) => {
              const table = tables.find((item) => item.id === reservation.tableId);
              const isSelected = reservation.id === selectedReservationId;
              return (
                <button
                  key={reservation.id}
                  type="button"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", reservation.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const draggedId = event.dataTransfer.getData("text/plain");
                    if (!draggedId || draggedId === reservation.id) return;
                    const newOrder = [...reservations];
                    const fromIndex = newOrder.findIndex((item) => item.id === draggedId);
                    const toIndex = newOrder.findIndex((item) => item.id === reservation.id);
                    if (fromIndex === -1 || toIndex === -1) return;
                    const [moved] = newOrder.splice(fromIndex, 1);
                    newOrder.splice(toIndex, 0, moved);
                    newOrder.forEach((item, orderIndex) => {
                      if (item.order !== orderIndex + 1) {
                        updateReservation({ id: item.id, order: orderIndex + 1 });
                      }
                    });
                  }}
                  onClick={() => setSelectedReservationId(reservation.id)}
                  className={`w-full text-left rounded-xl border p-3 transition ${isSelected ? "border-brass bg-white/10" : "border-white/10 hover:border-white/40"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{index + 1}. {reservation.guestName}</p>
                      <p className="text-xs text-white/60">Party {reservation.partySize} · {reservation.seats.length} seats</p>
                    </div>
                    <span className="text-xs text-white/60">{table ? table.name : "Unassigned"}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-2">{reservation.notes || "No notes"}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingReservation(reservation);
                        setIsModalOpen(true);
                      }}
                      className="text-xs px-2 py-1 rounded-full border border-white/10"
                    >
                      Edit
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Seat plan</p>
              <h2 className="text-lg font-serif">{selectedReservation ? selectedReservation.guestName : "Select reservation"}</h2>
            </div>
            {selectedReservation && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSeatCount({ reservationId: selectedReservation.id, count: selectedReservation.seats.length - 1 })}
                  disabled={selectedReservation.seats.length <= 1}
                  className="px-2 py-1 rounded-md border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="text-sm">{selectedReservation.seats.length} seats</span>
                <button
                  type="button"
                  onClick={() => updateSeatCount({ reservationId: selectedReservation.id, count: selectedReservation.seats.length + 1 })}
                  disabled={selectedReservation.seats.length >= 6}
                  className="px-2 py-1 rounded-md border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {selectedReservation ? (
            <>
              <TableVisualizer reservation={selectedReservation} table={selectedTable} statuses={state.statuses} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-white/50">Table assignment</label>
                  <select
                    value={selectedReservation.tableId ?? ""}
                    onChange={(event) => assignTable({ reservationId: selectedReservation.id, tableId: event.target.value || null })}
                    className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                  >
                    <option value="">Unassigned</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name} · cap {table.capacity}
                      </option>
                    ))}
                  </select>
                  {tables.length === 0 && (
                    <p className="text-xs text-garnet mt-2">
                      No tables configured yet. Use the setup page to add tables.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-white/50">Table shape</label>
                  <select
                    value={selectedReservation.tableShape ?? "square"}
                    onChange={(event) => updateReservation({ id: selectedReservation.id, tableShape: event.target.value as Reservation["tableShape"] })}
                    className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                  >
                    <option value="square">Square</option>
                    <option value="round">Round</option>
                    <option value="oval">Oval</option>
                    <option value="banquette">Banquette</option>
                    <option value="counter">Counter</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-white/50">Notes</label>
                  <input
                    value={selectedReservation.notes}
                    onChange={(event) => updateReservation({ id: selectedReservation.id, notes: event.target.value })}
                    className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                    placeholder="Service notes"
                  />
                </div>
              </div>
              {overCapacity && (
                <div className="rounded-xl border border-garnet/60 bg-garnet/20 p-3 text-sm">
                  Seat count exceeds table capacity ({capacity}). Consider reassigning or splitting.
                </div>
              )}
              <div className="flex gap-3 overflow-x-auto pb-2 subtle-scroll">
                {selectedReservation.seats.map((seat) => (
                  <div key={seat.id} className="min-w-[240px]">
                    <SeatTile
                      seat={seat}
                      onUpdate={(updatedSeat) => updateSeat({ reservationId: selectedReservation.id, seat: updatedSeat })}
                      onPositionChange={(position) => handleSeatPositionChange(seat.id, position)}
                      maxPositions={maxPositions}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-white/60">Select a reservation to edit the seat plan.</div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <FiringBoard
            table={selectedTable}
            statuses={state.statuses}
            timeline={state.timeline}
            onUpdateStatus={(status) => updateStatus({ status })}
            role="FOH"
            excludedCourses={selectedReservation?.excludedCourses ?? []}
          />
        </section>
      </div>
      )}

      {isModalOpen && (
        <ReservationModal
          initial={editingReservation ?? undefined}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReservation(null);
          }}
          onSave={(payload) => {
            if (editingReservation) {
              updateReservation({ id: editingReservation.id, ...payload });
            } else {
              createReservation(payload);
            }
            setIsModalOpen(false);
            setEditingReservation(null);
          }}
        />
      )}
    </div>
  );
};

export default function FOHPage({ searchParams }: { searchParams?: { session?: string } }) {
  const sessionId = searchParams?.session ?? "live";
  return (
    <ServiceProvider role="FOH" sessionId={sessionId}>
      <FOHScreen />
    </ServiceProvider>
  );
}
