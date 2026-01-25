import type { Reservation, Seat, ServiceStatus, Role, ServiceState, TimelineEvent } from "./types";
import type { Table } from "./types";

export type ReservationCreatePayload = {
  guestName: string;
  partySize: number;
  datetime: string;
  notes: string;
  excludedCourses: number[];
};

export type ReservationUpdatePayload = {
  id: string;
  guestName?: string;
  partySize?: number;
  datetime?: string;
  notes?: string;
  tableShape?: "square" | "round" | "oval" | "banquette" | "counter";
  excludedCourses?: number[];
  order?: number;
};

export type ReservationDeletePayload = {
  id: string;
};

export type TableAssignPayload = {
  reservationId: string;
  tableId: string | null;
};

export type SeatUpdatePayload = {
  reservationId: string;
  seat: Seat;
};

export type SeatCountPayload = {
  reservationId: string;
  count: number;
};

export type StatusUpdatePayload = {
  status: ServiceStatus;
};

export type TimelineEventPayload = {
  tableId: string;
  message: string;
  createdBy: Role;
  createdAt: number;
};

export type ResetPayload = {
  requestedBy: Role;
};

export type TablesUpdatePayload = {
  tables: Table[];
};

export type ServerToClientEvents = {
  state: (state: ServiceState) => void;
  reservation_created: (reservation: Reservation, version: number) => void;
  reservation_updated: (reservation: Reservation, version: number) => void;
  reservation_removed: (reservationId: string, version: number) => void;
  table_assigned: (reservation: Reservation, version: number) => void;
  seat_updated: (reservation: Reservation, version: number) => void;
  status_updated: (status: ServiceStatus, version: number) => void;
  timeline_event: (event: TimelineEventPayload, version: number) => void;
  tables_updated: (tables: Table[], version: number) => void;
  reset_done: (state: ServiceState) => void;
};

export type ClientToServerEvents = {
  create_reservation: (payload: ReservationCreatePayload) => void;
  update_reservation: (payload: ReservationUpdatePayload) => void;
  delete_reservation: (payload: ReservationDeletePayload) => void;
  update_tables: (payload: TablesUpdatePayload) => void;
  assign_table: (payload: TableAssignPayload) => void;
  update_seat: (payload: SeatUpdatePayload) => void;
  update_seat_count: (payload: SeatCountPayload) => void;
  update_status: (payload: StatusUpdatePayload) => void;
  reset_service: (payload: ResetPayload) => void;
};
