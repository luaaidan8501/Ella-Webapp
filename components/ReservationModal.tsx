"use client";

import { useState } from "react";
import type { Reservation } from "../lib/types";

export const ReservationModal = ({
  initial,
  onClose,
  onSave
}: {
  initial?: Reservation;
  onClose: () => void;
  onSave: (payload: { guestName: string; partySize: number; datetime: string; notes: string; excludedCourses: number[] }) => void;
}) => {
  const [guestName, setGuestName] = useState(initial?.guestName ?? "");
  const [partySize, setPartySize] = useState(initial?.partySize ?? 2);
  const [datetime, setDatetime] = useState(initial?.datetime ?? new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [excludedCourses, setExcludedCourses] = useState<number[]>(initial?.excludedCourses ?? []);

  const toggleCourse = (courseIndex: number) => {
    setExcludedCourses((prev) =>
      prev.includes(courseIndex) ? prev.filter((item) => item !== courseIndex) : [...prev, courseIndex]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif">{initial ? "Edit reservation" : "New reservation"}</h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">Guest name</label>
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
              placeholder="Guest"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-xs uppercase tracking-[0.2em] text-white/50">Datetime</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(event) => setDatetime(event.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 min-h-[80px]"
              placeholder="Allergies, VIP notes, timing"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-white/50">Skip courses</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, index) => {
                const course = index + 1;
                const selected = excludedCourses.includes(course);
                return (
                  <button
                    key={`course-${course}`}
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
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/20 text-white/70">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ guestName, partySize, datetime, notes, excludedCourses })}
            className="px-4 py-2 rounded-lg bg-brass text-ink font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
