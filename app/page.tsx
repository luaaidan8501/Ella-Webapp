"use client";

import { useMemo, useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { ServiceProvider, useService } from "../components/ServiceProvider";
import { TableVisualizer } from "../components/TableVisualizer";
import { SeatTile } from "../components/SeatTile";
import { v4 as uuidv4 } from "uuid";
import type { Reservation } from "../lib/types";

const isWednesday = (date: Date) => date.getDay() === 3;

const getNextWednesday = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = (3 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
};

const formatDateLabel = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
};

const SetupPanel = ({ sessionId }: { sessionId: string }) => {
  const { state, createReservation, updateReservation, deleteReservation, updateTables, updateSeat, assignTable } = useService();

  const nextWednesday = useMemo(() => getNextWednesday(), []);
  const [guestName, setGuestName] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState(nextWednesday.toISOString().slice(0, 10));
  const [time, setTime] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [excludedCourses, setExcludedCourses] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [tablesDraft, setTablesDraft] = useState<{ id: string; name: string; capacity: number }[]>([]);
  const [editGuestName, setEditGuestName] = useState("");
  const [editPartySize, setEditPartySize] = useState(2);
  const [editDate, setEditDate] = useState(nextWednesday.toISOString().slice(0, 10));
  const [editTime, setEditTime] = useState("19:00");
  const [editNotes, setEditNotes] = useState("");
  const [editExcludedCourses, setEditExcludedCourses] = useState<number[]>([]);

  const reservationsByDate = useMemo(() => {
    if (!state) return [] as Array<{ date: string; items: Reservation[] }>;
    const sorted = [...state.reservations].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const grouped = new Map<string, typeof state.reservations>();
    sorted.forEach((reservation) => {
      const dateKey = reservation.datetime.slice(0, 10);
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)?.push(reservation);
    });
    return Array.from(grouped.entries()).map(([key, items]) => ({ date: key, items }));
  }, [state]);

  useEffect(() => {
    if (!state) return;
    setTablesDraft(state.tables.map((table) => ({ ...table })));
  }, [state?.tables]);
  const selectedReservation =
    state?.reservations.find((reservation) => reservation.id === selectedReservationId) ?? state?.reservations[0] ?? null;
  const selectedTable = state?.tables.find((table) => table.id === selectedReservation?.tableId) ?? null;

  const handleCreate = () => {
    const datetime = new Date(`${date}T${time}`).toISOString();
    createReservation({
      guestName,
      partySize,
      datetime,
      notes,
      excludedCourses
    });
    setGuestName("");
    setPartySize(2);
    setNotes("");
    setExcludedCourses([]);
  };

  const startEdit = (reservationId: string) => {
    if (!state) return;
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (!reservation) return;
    const datePart = reservation.datetime.slice(0, 10);
    const timePart = reservation.datetime.slice(11, 16);
    setEditingId(reservationId);
    setEditGuestName(reservation.guestName);
    setEditPartySize(reservation.partySize);
    setEditDate(datePart);
    setEditTime(timePart);
    setEditNotes(reservation.notes);
    setEditExcludedCourses(reservation.excludedCourses ?? []);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const datetime = new Date(`${editDate}T${editTime}`).toISOString();
    updateReservation({
      id: editingId,
      guestName: editGuestName,
      partySize: editPartySize,
      datetime,
      notes: editNotes,
      excludedCourses: editExcludedCourses
    });
    setEditingId(null);
  };

  const toggleCourse = (courseIndex: number) => {
    setExcludedCourses((prev) =>
      prev.includes(courseIndex) ? prev.filter((item) => item !== courseIndex) : [...prev, courseIndex]
    );
  };

  const toggleEditCourse = (courseIndex: number) => {
    setEditExcludedCourses((prev) =>
      prev.includes(courseIndex) ? prev.filter((item) => item !== courseIndex) : [...prev, courseIndex]
    );
  };

  const confirmDelete = (reservationId: string) => {
    deleteReservation({ id: reservationId });
    if (deletingId === reservationId) {
      setDeletingId(null);
    }
  };

  const dateIsWednesday = isWednesday(new Date(`${date}T00:00`));
  const editDateIsWednesday = isWednesday(new Date(`${editDate}T00:00`));

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Setup</p>
          <h2 className="text-2xl font-serif">Create reservations</h2>
        </div>
        <span className="text-xs px-2 py-1 rounded-full border border-white/10 text-white/70">
          {sessionId === "training" ? "Training" : "Service"}
        </span>
      </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Guest name</label>
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Guest"
            className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Party size</label>
          <input
            type="number"
            min={1}
            max={6}
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value))}
            className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Date (Wednesdays)</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
          />
          {!dateIsWednesday && (
            <p className="text-xs text-garnet mt-1">Heads up: service normally runs Wednesdays.</p>
          )}
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Time</label>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Notes</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="VIP, allergies, special requests"
            className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-h-[90px]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Skip courses</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, index) => {
              const course = index + 1;
              const selected = excludedCourses.includes(course);
              return (
                <button
                  key={`create-course-${course}`}
                  type="button"
                  onClick={() => toggleCourse(course)}
                  className={`px-3 py-2 rounded-lg border text-xs ${selected ? "border-garnet text-garnet" : "border-white/10 text-white/70"}`}
                >
                  Course {course}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-white/50">Table assignment happens in FOH view.</p>
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 rounded-lg bg-brass text-ink font-semibold"
        >
          Add reservation
        </button>
      </div>

      {selectedReservation && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <h3 className="text-sm uppercase tracking-[0.2em] text-white/50">Seat plan preview</h3>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">Table assignment</label>
                <select
                  value={selectedReservation.tableId ?? ""}
                  onChange={(event) => assignTable({ reservationId: selectedReservation.id, tableId: event.target.value || null })}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                >
                  <option value="">Unassigned</option>
                  {state?.tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name} · cap {table.capacity}
                    </option>
                  ))}
                </select>
                {state?.tables.length === 0 && (
                  <p className="text-xs text-garnet mt-2">
                    No tables configured yet. Add tables below to assign.
                  </p>
                )}
              </div>
              <TableVisualizer reservation={selectedReservation} table={selectedTable} statuses={state?.statuses ?? []} />
            </div>
            <div className="grid grid-cols-1 gap-3 max-h-[45vh] overflow-auto subtle-scroll">
              {selectedReservation.seats.map((seat) => (
                <SeatTile
                  key={seat.id}
                  seat={seat}
                  onUpdate={(updatedSeat) => updateSeat({ reservationId: selectedReservation.id, seat: updatedSeat })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-white/10 pt-4">
        <h3 className="text-sm uppercase tracking-[0.2em] text-white/50">Upcoming reservations</h3>
        <div className="mt-3 space-y-4 max-h-[40vh] overflow-auto subtle-scroll">
          {reservationsByDate.length === 0 ? (
            <p className="text-sm text-white/50">No reservations added yet.</p>
          ) : (
            reservationsByDate.map((group) => (
              <div key={group.date} className="rounded-xl border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{formatDateLabel(group.date)}</p>
                  <span className="text-xs text-white/50">{group.items.length} reservations</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {group.items.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer ${
                        reservation.id === selectedReservation?.id
                          ? "border-brass bg-white/10"
                          : "border-white/10 bg-white/5"
                      }`}
                      onClick={() => setSelectedReservationId(reservation.id)}
                    >
                      <div>
                        <p>{reservation.guestName}</p>
                        <p className="text-xs text-white/50">Party {reservation.partySize} · {new Date(reservation.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        {reservation.excludedCourses?.length ? (
                          <p className="text-[10px] text-garnet mt-1">Skip: {reservation.excludedCourses.map((course) => `C${course}`).join(", ")}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40 max-w-[200px] truncate">{reservation.notes || "No notes"}</span>
                        <button
                          type="button"
                          onClick={() => startEdit(reservation.id)}
                          className="text-xs px-3 py-2 rounded-full border border-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(reservation.id)}
                          className="text-xs px-3 py-2 rounded-full border border-red-300/60 text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editingId && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <h3 className="text-sm uppercase tracking-[0.2em] text-white/50">Edit reservation</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Guest name</label>
              <input
                value={editGuestName}
                onChange={(event) => setEditGuestName(event.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Party size</label>
              <input
                type="number"
                min={1}
                max={6}
                value={editPartySize}
                onChange={(event) => setEditPartySize(Number(event.target.value))}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Date (Wednesdays)</label>
              <input
                type="date"
                value={editDate}
                onChange={(event) => setEditDate(event.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
              />
              {!editDateIsWednesday && (
                <p className="text-xs text-garnet mt-1">Heads up: service normally runs Wednesdays.</p>
              )}
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Time</label>
              <input
                type="time"
                value={editTime}
                onChange={(event) => setEditTime(event.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Notes</label>
              <textarea
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-h-[90px]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Skip courses</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }, (_, index) => {
                  const course = index + 1;
                  const selected = editExcludedCourses.includes(course);
                  return (
                    <button
                      key={`edit-course-${course}`}
                      type="button"
                      onClick={() => toggleEditCourse(course)}
                      className={`px-3 py-2 rounded-lg border text-xs ${selected ? "border-garnet text-garnet" : "border-white/10 text-white/70"}`}
                    >
                      Course {course}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-white/20 text-white/70">
              Cancel
            </button>
            <button type="button" onClick={handleUpdate} className="px-4 py-2 rounded-lg bg-brass text-ink font-semibold">
              Save changes
            </button>
          </div>
        </div>
      )}
      <DeleteModal
        reservation={deletingId ? state?.reservations.find((item) => item.id === deletingId) ?? null : null}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            confirmDelete(deletingId);
          }
        }}
      />

      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm uppercase tracking-[0.2em] text-white/50">Tables</h3>
          <button
            type="button"
            onClick={() => setTablesDraft((prev) => [...prev, { id: uuidv4(), name: "T", capacity: 2 }])}
            className="text-xs px-3 py-2 rounded-full border border-white/10"
          >
            Add table
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {tablesDraft.map((table, index) => (
            <div key={table.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <input
                value={table.name}
                onChange={(event) => {
                  const value = event.target.value;
                  setTablesDraft((prev) => prev.map((item) => (item.id === table.id ? { ...item, name: value } : item)));
                }}
                className="w-28 bg-black/40 border border-white/10 rounded-md px-2 py-1 text-sm"
                placeholder={`T${index + 1}`}
              />
              <input
                type="number"
                min={1}
                max={12}
                value={table.capacity}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setTablesDraft((prev) => prev.map((item) => (item.id === table.id ? { ...item, capacity: value } : item)));
                }}
                className="w-24 bg-black/40 border border-white/10 rounded-md px-2 py-1 text-sm"
              />
              <span className="text-xs text-white/50">seats</span>
              <button
                type="button"
                onClick={() => setTablesDraft((prev) => prev.filter((item) => item.id !== table.id))}
                className="ml-auto text-xs px-3 py-2 rounded-full border border-red-300/60 text-red-200"
              >
                Remove
              </button>
            </div>
          ))}
          {tablesDraft.length === 0 && <p className="text-xs text-white/50">No tables yet. Add your first table.</p>}
        </div>
        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => updateTables({ tables: tablesDraft })}
            className="px-4 py-2 rounded-lg bg-brass text-ink font-semibold"
          >
            Save tables
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({
  reservation,
  onCancel,
  onConfirm
}: {
  reservation: { id: string; guestName: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!reservation) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
      <div className="card p-6 w-full max-w-md">
        <h3 className="text-xl font-serif">Delete reservation</h3>
        <p className="text-white/70 mt-2">Are you sure you want to delete this reservation?</p>
        <p className="text-white/50 text-sm mt-1">{reservation.guestName}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-white/20 text-white/70">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-lg border border-red-300/60 text-red-200">
            Confirm delete
          </button>
        </div>
      </div>
    </div>
  );
};

const LandingContent = ({
  trainingMode,
  setTrainingMode
}: {
  trainingMode: boolean;
  setTrainingMode: Dispatch<SetStateAction<boolean>>;
}) => {
  const sessionId = trainingMode ? "training" : "live";
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-6">
        <div className="card p-8 h-fit">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Ella Service Sync</p>
            <h1 className="text-3xl font-serif mt-2">Choose your station</h1>
            <p className="text-white/60 mt-2">Fast entry for FOH and BOH. Toggle training mode for practice runs.</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <Link
              href={`/foh?session=${sessionId}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-brass/70 transition"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Front of House</p>
              <p className="text-2xl font-serif mt-2">FOH View</p>
              <p className="text-white/60 mt-2">Reservations, seat plan, and course firing for the floor.</p>
            </Link>
            <Link
              href={`/boh?session=${sessionId}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-sage/70 transition"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Back of House</p>
              <p className="text-2xl font-serif mt-2">BOH View</p>
              <p className="text-white/60 mt-2">Course firing board and seat alerts for the kitchen.</p>
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-sm">Training mode</p>
              <p className="text-xs text-white/50">Use a separate live session for practice runs.</p>
            </div>
            <button
              type="button"
              onClick={() => setTrainingMode((prev) => !prev)}
              className={`px-4 py-2 rounded-full border ${trainingMode ? "bg-brass text-ink border-brass" : "border-white/20 text-white/70"}`}
            >
              {trainingMode ? "Training On" : "Training Off"}
            </button>
          </div>
        </div>

        <SetupPanel sessionId={sessionId} />
      </div>
    </div>
  );
};

export default function HomePage() {
  const [trainingMode, setTrainingMode] = useState(false);
  const sessionId = trainingMode ? "training" : "live";

  return (
    <ServiceProvider role="FOH" sessionId={sessionId}>
      <LandingContent trainingMode={trainingMode} setTrainingMode={setTrainingMode} />
    </ServiceProvider>
  );
}
