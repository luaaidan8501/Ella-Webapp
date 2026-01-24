import type { ServiceStore, ServiceStoreManager } from "./lib/store";
import type { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __serviceStore: ServiceStore | undefined;
  // eslint-disable-next-line no-var
  var __serviceStores: ServiceStoreManager | undefined;
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export {};
