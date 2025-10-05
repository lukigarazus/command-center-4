// Event type definitions for cross-app communication

export type EventListener<T = unknown> = (payload: T) => void;

// Define all event payloads here
export interface AppMessagePayload {
  text: string;
  timestamp: number;
}

// Define the event map with event names and their payload types
export interface EventMap {
  'app-message': AppMessagePayload;
  // Add more events here as needed
}

// Type-safe event emitter
export interface EventEmitter {
  emit: <K extends keyof EventMap>(
    eventType: K,
    payload: EventMap[K]
  ) => Promise<void>;
  listen: <K extends keyof EventMap>(
    eventType: K,
    handler: EventListener<EventMap[K]>
  ) => Promise<() => void>;
}
