import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import {
  emit as tauriEmit,
  listen as tauriListen,
  TauriEvent,
  EmitOptions,
} from "@tauri-apps/api/event";
import type { EventEmitter, EventListener, EventMap } from "../types/events";
import { isTauri } from "@tauri-apps/api/core";

const EventContext = createContext<EventEmitter | null>(null);

// Detect if we're running in Tauri context
const isTauriContext = () => {
  return isTauri();
};

// Helper to get localStorage key for event type
const getEventStorageKey = (eventType: string) => `event:${eventType}`;

// Tauri event emitter implementation
const createTauriEmitter = (): EventEmitter => ({
  emit: async <K extends keyof EventMap>(eventType: K, payload: EventMap[K]) => {
    // Store the event in localStorage
    const storageKey = getEventStorageKey(eventType as string);
    localStorage.setItem(storageKey, JSON.stringify(payload));

    // Emit to all windows
    await tauriEmit(eventType as string, payload);
  },
  listen: async <K extends keyof EventMap>(
    eventType: K,
    handler: EventListener<EventMap[K]>
  ) => {
    // Listen for future events
    const unlisten = await tauriListen<EventMap[K]>(eventType as string, (event) => {
      handler(event.payload);
    });
    return unlisten;
  },
});

// Stub web event emitter (for future implementation)
const createWebEmitter = (): EventEmitter => ({
  emit: async <K extends keyof EventMap>(eventType: K, payload: EventMap[K]) => {
    // Store the event in localStorage
    const storageKey = getEventStorageKey(eventType as string);
    localStorage.setItem(storageKey, JSON.stringify(payload));

    console.log("[WebEmitter] Emit not implemented:", eventType, payload);
  },
  listen: async <K extends keyof EventMap>(
    eventType: K,
    handler: EventListener<EventMap[K]>
  ) => {
    console.log("[WebEmitter] Listen not implemented:", eventType);
    return () => {};
  },
});

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider = ({ children }: EventProviderProps) => {
  const [emitter] = useState<EventEmitter>(() =>
    isTauriContext() ? createTauriEmitter() : createWebEmitter()
  );

  return (
    <EventContext.Provider value={emitter}>{children}</EventContext.Provider>
  );
};

export const useEvents = (): EventEmitter => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within EventProvider");
  }
  return context;
};

// Hook for subscribing to specific events
export const useEventListener = <K extends keyof EventMap>(
  eventType: K,
  handler: EventListener<EventMap[K]>
) => {
  const events = useEvents();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      // Only load from storage on first mount
      if (!hasInitialized) {
        const storageKey = getEventStorageKey(eventType as string);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const payload = JSON.parse(stored) as EventMap[K];
            handler(payload);
          } catch (e) {
            console.error(`Failed to parse stored event ${eventType}:`, e);
          }
        }
        setHasInitialized(true);
      }

      // Listen for future events
      const unlistenFn = await events.listen(eventType, handler);
      unlisten = unlistenFn;
    };

    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [eventType, events]);
};
