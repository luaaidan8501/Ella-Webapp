import type { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import { serviceStoreManager } from "../../lib/store";
import type { ClientToServerEvents, ServerToClientEvents } from "../../lib/events";
import type { Role, ServiceStatus } from "../../lib/types";

type SocketServer = HTTPServer & {
  io?: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
};

type SocketWithIO = NetSocket & {
  server: SocketServer;
};

type NextApiResponseWithSocket = NextApiResponse & {
  socket: SocketWithIO;
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false
    });

    io.on("connection", (socket) => {
      const sessionId = typeof socket.handshake.query.session === "string" ? socket.handshake.query.session : "live";
      socket.join(sessionId);
      const store = serviceStoreManager.getStore(sessionId);
      store.ensureHydrated().then(() => {
        socket.emit("state", store.getSnapshot());
      });

      socket.on("create_reservation", async (payload) => {
        await store.ensureHydrated();
        const result = store.createReservation(payload);
        io.to(sessionId).emit("reservation_created", result.reservation, result.version);
      });

      socket.on("update_reservation", async (payload) => {
        await store.ensureHydrated();
        const result = store.updateReservation(payload);
        if (!result) return;
        io.to(sessionId).emit("reservation_updated", result.reservation, result.version);
      });

      socket.on("update_tables", async (payload) => {
        await store.ensureHydrated();
        const result = store.updateTables(payload);
        if (!result) return;
        io.to(sessionId).emit("tables_updated", result.tables, result.version);
      });

      socket.on("delete_reservation", async (payload) => {
        await store.ensureHydrated();
        const result = store.deleteReservation(payload);
        if (!result) return;
        io.to(sessionId).emit("reservation_removed", result.id, result.version);
      });

      socket.on("assign_table", async (payload) => {
        await store.ensureHydrated();
        const result = store.assignTable(payload);
        if (!result) return;
        io.to(sessionId).emit("table_assigned", result.reservation, result.version);
      });

      socket.on("update_seat", async (payload) => {
        await store.ensureHydrated();
        const result = store.updateSeat(payload);
        if (!result) return;
        io.to(sessionId).emit("seat_updated", result.reservation, result.version);
      });

      socket.on("update_seat_count", async (payload) => {
        await store.ensureHydrated();
        const result = store.setSeatCount(payload);
        if (!result) return;
        io.to(sessionId).emit("seat_updated", result.reservation, result.version);
      });

      socket.on("update_status", async (payload) => {
        await store.ensureHydrated();
        const incoming = payload.status;
        const status: ServiceStatus = {
          ...incoming,
          updatedAt: Date.now()
        };
        const result = store.updateStatus({ status });
        if (!result) return;
        io.to(sessionId).emit("status_updated", result.status, result.version);
        io.to(sessionId).emit("timeline_event", {
          tableId: result.event.tableId,
          message: result.event.message,
          createdBy: result.event.createdBy,
          createdAt: result.event.createdAt
        }, result.version);
      });

      socket.on("reset_service", async (payload) => {
        await store.ensureHydrated();
        if (payload.requestedBy !== "FOH" && payload.requestedBy !== "BOH") return;
        serviceStoreManager.resetStore(sessionId);
        io.to(sessionId).emit("reset_done", store.getSnapshot());
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
