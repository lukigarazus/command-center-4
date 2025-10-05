// Event type definitions for cross-app communication

export interface AppEvent<T = unknown> {
  type: string;
  payload: T;
}

export type EventListener<T = unknown> = (payload: T) => void;

export interface EventEmitter {
  emit: <T = unknown>(eventType: string, payload: T) => Promise<void>;
  listen: <T = unknown>(
    eventType: string,
    handler: EventListener<T>
  ) => Promise<() => void>;
}
