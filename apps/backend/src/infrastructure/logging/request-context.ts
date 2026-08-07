import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId: string;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  run(store: RequestContextStore, callback: () => void): void {
    storage.run(store, callback);
  },
  getId(): string | undefined {
    return storage.getStore()?.requestId;
  },
};
