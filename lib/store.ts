import { v4 as uuidv4 } from "uuid";
import type {
  Reservation,
  Table,
  Seat,
  ServiceStatus,
  ServiceStatusType,
  ServiceState,
  Role,
  TimelineEvent
} from "./types";

const COURSE_COUNT = 6;
const MAX_SEATS = 6;

const statusCycle: ServiceStatusType[] = ["STANDBY", "PLATE_UP", "PICK_UP", "SERVED"];

const createSeat = (seatNumber: number): Seat => ({
  id: uuidv4(),
  seatNumber,
  lateStatus: "on-time",
  allergyNotes: "",
  drinkPreference: "none"
});

const seedTables = (): Table[] => [];

const seedReservations = (): Reservation[] => [];

const buildStatusSeed = (tables: Table[]): ServiceStatus[] => {
  const statuses: ServiceStatus[] = [];
  tables.forEach((table) => {
    for (let i = 1; i <= COURSE_COUNT; i += 1) {
      statuses.push({
        tableId: table.id,
        courseIndex: i,
        status: "STANDBY",
        updatedBy: "FOH",
        updatedAt: Date.now()
      });
    }
  });
  return statuses;
};

export class ServiceStore {
  private version = 1;
  private reservations = new Map<string, Reservation>();
  private tables = new Map<string, Table>();
  private statuses = new Map<string, ServiceStatus>();
  private timeline = new Map<string, TimelineEvent[]>();

  constructor() {
    this.reset();
  }

  private nextVersion() {
    this.version += 1;
    return this.version;
  }

  private statusKey(tableId: string, courseIndex?: number, drinkIndex?: number) {
    return `${tableId}:${courseIndex ?? ""}:${drinkIndex ?? ""}`;
  }

  private ensureTimeline(tableId: string) {
    if (!this.timeline.has(tableId)) {
      this.timeline.set(tableId, []);
    }
  }

  getSnapshot(): ServiceState {
    return {
      version: this.version,
      reservations: Array.from(this.reservations.values()),
      tables: Array.from(this.tables.values()),
      statuses: Array.from(this.statuses.values()),
      timeline: Array.from(this.timeline.values()).flat()
    };
  }

  reset() {
    this.version = 1;
    this.reservations.clear();
    this.tables.clear();
    this.statuses.clear();
    this.timeline.clear();

    const tables = seedTables();
    tables.forEach((table) => this.tables.set(table.id, table));

    const reservations = seedReservations();
    reservations.forEach((reservation) => this.reservations.set(reservation.id, reservation));

    buildStatusSeed(tables).forEach((status) => {
      this.statuses.set(this.statusKey(status.tableId, status.courseIndex, status.drinkIndex), status);
    });
  }

  updateTables(payload: { tables: Table[] }) {
    const sanitized = payload.tables
      .filter((table) => table.name.trim().length > 0)
      .map((table) => ({
        ...table,
        name: table.name.trim(),
        capacity: Math.max(1, Math.min(12, table.capacity))
      }));
    const tableIds = new Set(sanitized.map((table) => table.id));
    this.tables.clear();
    sanitized.forEach((table) => this.tables.set(table.id, table));

    const reservations = Array.from(this.reservations.values()).map((reservation) => {
      if (reservation.tableId && !tableIds.has(reservation.tableId)) {
        return { ...reservation, tableId: null };
      }
      return reservation;
    });
    this.reservations.clear();
    reservations.forEach((reservation) => this.reservations.set(reservation.id, reservation));

    return { tables: Array.from(this.tables.values()), version: this.nextVersion() };
  }

  createReservation(payload: {
    guestName: string;
    partySize: number;
    datetime: string;
    notes: string;
    excludedCourses: number[];
  }) {
    const partySize = Math.max(1, Math.min(payload.partySize, MAX_SEATS));
    const reservation: Reservation = {
      id: uuidv4(),
      guestName: payload.guestName.trim() || "Guest",
      partySize,
      datetime: payload.datetime,
      notes: payload.notes ?? "",
      tableId: null,
      tableShape: "round",
      excludedCourses: payload.excludedCourses ?? [],
      seats: Array.from({ length: partySize }, (_, index) => createSeat(index + 1))
    };
    this.reservations.set(reservation.id, reservation);
    return { reservation, version: this.nextVersion() };
  }

  updateReservation(payload: {
    id: string;
    guestName?: string;
    partySize?: number;
    datetime?: string;
    notes?: string;
    tableShape?: "round" | "oval" | "banquette" | "counter";
    excludedCourses?: number[];
  }) {
    const reservation = this.reservations.get(payload.id);
    if (!reservation) return null;

    if (payload.guestName !== undefined) reservation.guestName = payload.guestName.trim() || reservation.guestName;
    if (payload.partySize !== undefined) {
      reservation.partySize = Math.max(1, Math.min(payload.partySize, MAX_SEATS));
    }
    if (payload.datetime !== undefined) reservation.datetime = payload.datetime;
    if (payload.notes !== undefined) reservation.notes = payload.notes;
    if (payload.tableShape !== undefined) reservation.tableShape = payload.tableShape;
    if (payload.excludedCourses !== undefined) reservation.excludedCourses = payload.excludedCourses;

    this.reservations.set(reservation.id, reservation);
    return { reservation, version: this.nextVersion() };
  }

  deleteReservation(payload: { id: string }) {
    const existed = this.reservations.delete(payload.id);
    if (!existed) return null;
    return { id: payload.id, version: this.nextVersion() };
  }

  assignTable(payload: { reservationId: string; tableId: string | null }) {
    const reservation = this.reservations.get(payload.reservationId);
    if (!reservation) return null;
    reservation.tableId = payload.tableId;
    if (reservation.seats.length === 0) {
      reservation.seats = Array.from({ length: reservation.partySize }, (_, index) => createSeat(index + 1));
    }
    this.ensureTimeline(payload.tableId ?? "unassigned");
    if (payload.tableId) {
      this.ensureTimeline(payload.tableId);
    }
    this.reservations.set(reservation.id, reservation);
    return { reservation, version: this.nextVersion() };
  }

  setSeatCount(payload: { reservationId: string; count: number }) {
    const reservation = this.reservations.get(payload.reservationId);
    if (!reservation) return null;
    const count = Math.max(1, Math.min(payload.count, MAX_SEATS));
    if (count > reservation.seats.length) {
      for (let i = reservation.seats.length + 1; i <= count; i += 1) {
        reservation.seats.push(createSeat(i));
      }
    } else if (count < reservation.seats.length) {
      reservation.seats = reservation.seats.slice(0, count);
    }
    reservation.seats = reservation.seats.map((seat, index) => ({ ...seat, seatNumber: index + 1 }));
    this.reservations.set(reservation.id, reservation);
    return { reservation, version: this.nextVersion() };
  }

  updateSeat(payload: { reservationId: string; seat: Seat }) {
    const reservation = this.reservations.get(payload.reservationId);
    if (!reservation) return null;
    const seatIndex = reservation.seats.findIndex((seat) => seat.id === payload.seat.id);
    if (seatIndex === -1) return null;
    reservation.seats[seatIndex] = payload.seat;
    this.reservations.set(reservation.id, reservation);
    return { reservation, version: this.nextVersion() };
  }

  updateStatus(payload: { status: ServiceStatus }) {
    const status = payload.status;
    const key = this.statusKey(status.tableId, status.courseIndex, status.drinkIndex);
    this.statuses.set(key, status);
    this.ensureTimeline(status.tableId);
    const event: TimelineEvent = {
      id: uuidv4(),
      tableId: status.tableId,
      message: `${status.courseIndex ? `Course ${status.courseIndex}` : `Drink ${status.drinkIndex}`} → ${status.status}`,
      createdBy: status.updatedBy,
      createdAt: status.updatedAt
    };
    this.timeline.get(status.tableId)?.unshift(event);
    return { status, version: this.nextVersion(), event };
  }

  advanceStatus(tableId: string, kind: "course" | "drink", index: number, updatedBy: Role) {
    const key = this.statusKey(tableId, kind === "course" ? index : undefined, kind === "drink" ? index : undefined);
    const current = this.statuses.get(key);
    const currentStatus = current?.status ?? "STANDBY";
    const nextIndex = (statusCycle.indexOf(currentStatus) + 1) % statusCycle.length;
    const status: ServiceStatus = {
      tableId,
      courseIndex: kind === "course" ? index : undefined,
      drinkIndex: kind === "drink" ? index : undefined,
      status: statusCycle[nextIndex],
      updatedBy,
      updatedAt: Date.now()
    };
    return this.updateStatus({ status });
  }

  getTableCapacity(tableId: string | null) {
    if (!tableId) return null;
    return this.tables.get(tableId)?.capacity ?? null;
  }
}

export const serviceStore = globalThis.__serviceStore ?? new ServiceStore();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__serviceStore = serviceStore;

export type ServiceSessionId = "live" | "training" | string;

export class ServiceStoreManager {
  private stores = new Map<ServiceSessionId, ServiceStore>();

  getStore(sessionId: ServiceSessionId) {
    if (!this.stores.has(sessionId)) {
      this.stores.set(sessionId, new ServiceStore());
    }
    return this.stores.get(sessionId)!;
  }

  resetStore(sessionId: ServiceSessionId) {
    const store = this.getStore(sessionId);
    store.reset();
    return store;
  }
}

export const serviceStoreManager = globalThis.__serviceStores ?? new ServiceStoreManager();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__serviceStores = serviceStoreManager;
