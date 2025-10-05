// Event type definitions for cross-app communication

export type EventListener<T = unknown> = (payload: T) => void;

// Define all event payloads here
export interface AppMessagePayload {
  text: string;
  timestamp: number;
}

export interface CalendarDateSelectedPayload {
  date: string; // ISO 8601 date string
  timestamp: number;
}

export interface WeatherDataChangedPayload {
  temperature: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  location: string;
  date: string; // ISO 8601 date string
  timestamp: number;
}

// Define the event map with event names and their payload types
export interface EventMap {
  'app-message': AppMessagePayload;
  'calendar-date-selected': CalendarDateSelectedPayload;
  'weather-data-changed': WeatherDataChangedPayload;
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
