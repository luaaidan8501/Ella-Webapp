export type Role = "FOH" | "BOH";

export type DrinkPreference = "cocktail" | "mocktail" | "none";
export type LateStatus = "on-time" | "late" | "arrived";

export type Seat = {
  id: string;
  seatNumber: number;
  lateStatus: LateStatus;
  allergyNotes: string;
  drinkPreference: DrinkPreference;
  excludedCourses: number[];
  excludedDrinks: number[];
};

export type Reservation = {
  id: string;
  guestName: string;
  partySize: number;
  datetime: string;
  notes: string;
  tableId: string | null;
  tableShape: "square" | "round" | "oval" | "banquette" | "counter";
  excludedCourses: number[];
  order: number;
  seats: Seat[];
};

export type Table = {
  id: string;
  name: string;
  capacity: number;
};

export type ServiceStatusType = "STANDBY" | "PLATE_UP" | "PICK_UP" | "SERVED";

export type ServiceStatus = {
  tableId: string;
  courseIndex?: number;
  drinkIndex?: number;
  status: ServiceStatusType;
  updatedBy: Role;
  updatedAt: number;
};

export type TimelineEvent = {
  id: string;
  tableId: string;
  message: string;
  createdBy: Role;
  createdAt: number;
};

export type ServiceState = {
  version: number;
  reservations: Reservation[];
  tables: Table[];
  statuses: ServiceStatus[];
  timeline: TimelineEvent[];
};
