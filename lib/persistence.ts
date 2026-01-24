import { prisma } from "./prisma";
import type { ServiceState } from "./types";

export const loadSessionState = async (sessionId: string): Promise<ServiceState | null> => {
  if (!process.env.DATABASE_URL) return null;
  const record = await prisma.serviceSession.findUnique({
    where: { id: sessionId }
  });
  if (!record) return null;
  return record.state as ServiceState;
};

export const saveSessionState = async (sessionId: string, state: ServiceState) => {
  if (!process.env.DATABASE_URL) return;
  await prisma.serviceSession.upsert({
    where: { id: sessionId },
    create: { id: sessionId, state },
    update: { state }
  });
};
