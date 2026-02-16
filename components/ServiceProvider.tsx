"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ReservationCreatePayload,
  ReservationUpdatePayload,
  ReservationDeletePayload,
  TablesUpdatePayload,
  TableAssignPayload,
  SeatUpdatePayload,
  SeatCountPayload,
  StatusUpdatePayload,
  ResetPayload
} from "../lib/events";
import type { Reservation, Role, ServiceState, ServiceStatus, TimelineEvent } from "../lib/types";

const applyReservationUpdate = (state: ServiceState, reservation: Reservation) => {
  const reservations = state.reservations.filter((item) => item.id !== reservation.id);
  return { ...state, reservations: [...reservations, reservation] };
};

const applyReservationRemove = (state: ServiceState, reservationId: string) => {
  const reservations = state.reservations.filter((item) => item.id !== reservationId);
  return { ...state, reservations };
};

const applyTablesUpdate = (state: ServiceState, tables: ServiceState["tables"]) => {
  return { ...state, tables };
};

const applyStatusUpdate = (state: ServiceState, status: ServiceStatus) => {
  const statuses = state.statuses.filter((item) => {
    const sameTable = item.tableId === status.tableId;
    const sameCourse = item.courseIndex === status.courseIndex;
    const sameDrink = item.drinkIndex === status.drinkIndex;
    return !(sameTable && sameCourse && sameDrink);
  });
  return { ...state, statuses: [...statuses, status] };
};

const applyTimelineEvent = (state: ServiceState, event: TimelineEvent) => {
  return { ...state, timeline: [event, ...state.timeline] };
};

const updateReservationSeats = (state: ServiceState, reservationId: string, seatId: string, seatUpdate: Reservation["seats"][number]) => {
  const reservations = state.reservations.map((reservation) => {
    if (reservation.id !== reservationId) return reservation;
    return {
      ...reservation,
      seats: reservation.seats.map((seat) => (seat.id === seatId ? seatUpdate : seat))
    };
  });
  return { ...state, reservations };
};

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const applyReservationPatch = (state: ServiceState, payload: { id: string } & Partial<Reservation>) => {
  const reservations = state.reservations.map((reservation) => {
    if (reservation.id !== payload.id) return reservation;
    return { ...reservation, ...payload };
  });
  return { ...state, reservations };
};

type ServiceContextValue = {
  state: ServiceState | null;
  connected: boolean;
  role: Role;
  sessionId: string;
  soundEnabled: boolean;
  toggleSound: () => void;
  createReservation: (payload: ReservationCreatePayload) => void;
  updateReservation: (payload: ReservationUpdatePayload) => void;
  deleteReservation: (payload: ReservationDeletePayload) => void;
  updateTables: (payload: TablesUpdatePayload) => void;
  assignTable: (payload: TableAssignPayload) => void;
  updateSeat: (payload: SeatUpdatePayload) => void;
  updateSeatCount: (payload: SeatCountPayload) => void;
  updateStatus: (payload: StatusUpdatePayload) => void;
  resetService: (payload: ResetPayload) => void;
};

const ServiceContext = createContext<ServiceContextValue | null>(null);

export const useService = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useService must be used within ServiceProvider");
  }
  return context;
};

export const ServiceProvider = ({
  role,
  sessionId,
  children
}: {
  role: Role;
  sessionId: string;
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<ServiceState | null>(null);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);

  const speakStatus = (status: ServiceStatus["status"]) => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const phrases: Record<ServiceStatus["status"], string> = {
      STANDBY: "standby",
      PLATE_UP: "plate up",
      PICK_UP: "pick up",
      SERVED: "served"
    };
    const utterance = new SpeechSynthesisUtterance(phrases[status]);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;
    synth.cancel();
    synth.speak(utterance);
  };

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("soundEnabled") : null;
    if (stored) {
      const enabled = stored === "true";
      setSoundEnabled(enabled);
      soundEnabledRef.current = enabled;
    }
  }, []);

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: "/api/socket",
      addTrailingSlash: false,
      query: { session: sessionId },
      transports: ["polling", "websocket"],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 30000,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("state", (snapshot) => {
      setState(snapshot);
    });

    socket.on("reservation_created", (reservation, version) => {
      setState((prev) => (prev ? { ...applyReservationUpdate(prev, reservation), version } : prev));
    });

    socket.on("reservation_updated", (reservation, version) => {
      setState((prev) => (prev ? { ...applyReservationUpdate(prev, reservation), version } : prev));
    });

    socket.on("reservation_removed", (reservationId, version) => {
      setState((prev) => (prev ? { ...applyReservationRemove(prev, reservationId), version } : prev));
    });

    socket.on("tables_updated", (tables, version) => {
      setState((prev) => (prev ? { ...applyTablesUpdate(prev, tables), version } : prev));
    });

    socket.on("table_assigned", (reservation, version) => {
      setState((prev) => (prev ? { ...applyReservationUpdate(prev, reservation), version } : prev));
    });

    socket.on("seat_updated", (reservation, version) => {
      setState((prev) => (prev ? { ...applyReservationUpdate(prev, reservation), version } : prev));
    });

    socket.on("status_updated", (status, version) => {
      setState((prev) => (prev ? { ...applyStatusUpdate(prev, status), version } : prev));
      if (soundEnabledRef.current) {
        speakStatus(status.status);
      }
    });

    socket.on("timeline_event", (event, version) => {
      setState((prev) =>
        prev ? { ...applyTimelineEvent(prev, { ...event, id: generateId() }), version } : prev
      );
    });

    socket.on("reset_done", (snapshot) => {
      setState(snapshot);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("soundEnabled", String(soundEnabled));
    if (soundEnabled && !audioRef.current) {
      audioRef.current = new AudioContext();
      void audioRef.current.resume();
    }
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const actions = useMemo(() => {
    return {
      createReservation: (payload: ReservationCreatePayload) => {
        socketRef.current?.emit("create_reservation", payload);
      },
      updateReservation: (payload: ReservationUpdatePayload) => {
        setState((prev) => (prev ? { ...applyReservationPatch(prev, payload), version: prev.version + 1 } : prev));
        socketRef.current?.emit("update_reservation", payload);
      },
      deleteReservation: (payload: ReservationDeletePayload) => {
        setState((prev) => (prev ? { ...applyReservationRemove(prev, payload.id), version: prev.version + 1 } : prev));
        socketRef.current?.emit("delete_reservation", payload);
      },
      updateTables: (payload: TablesUpdatePayload) => {
        setState((prev) => (prev ? { ...applyTablesUpdate(prev, payload.tables), version: prev.version + 1 } : prev));
        socketRef.current?.emit("update_tables", payload);
      },
      assignTable: (payload: TableAssignPayload) => {
        socketRef.current?.emit("assign_table", payload);
      },
      updateSeat: (payload: SeatUpdatePayload) => {
        setState((prev) =>
          prev
            ? { ...updateReservationSeats(prev, payload.reservationId, payload.seat.id, payload.seat), version: prev.version + 1 }
            : prev
        );
        socketRef.current?.emit("update_seat", payload);
      },
      updateSeatCount: (payload: SeatCountPayload) => {
        socketRef.current?.emit("update_seat_count", payload);
      },
      updateStatus: (payload: StatusUpdatePayload) => {
        if (state) {
          setState((prev) => (prev ? { ...applyStatusUpdate(prev, payload.status), version: prev.version + 1 } : prev));
        }
        socketRef.current?.emit("update_status", payload);
      },
      resetService: (payload: ResetPayload) => {
        socketRef.current?.emit("reset_service", payload);
      }
    };
  }, [state]);

  const value = useMemo(
    () => ({
      state,
      connected,
      role,
      sessionId,
      soundEnabled,
      toggleSound: () => setSoundEnabled((prev) => !prev),
      ...actions
    }),
    [state, connected, role, sessionId, soundEnabled, actions]
  );

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
};
