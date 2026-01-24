import type { ServiceStore, ServiceStoreManager } from "./lib/store";

declare global {
  // eslint-disable-next-line no-var
  var __serviceStore: ServiceStore | undefined;
  // eslint-disable-next-line no-var
  var __serviceStores: ServiceStoreManager | undefined;
}

export {};
