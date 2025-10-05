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
} from "@tauri-apps/api/event";
import type { EventEmitter, EventListener, EventMap } from "../types/events";
import { isTauri } from "@tauri-apps/api/core";

const EventContext = createContext<EventEmitter | null>(null);

// Detect if we're running in Tauri context
const isTauriContext = () => {
  return isTauri();
};

// Tauri event emitter implementation
const createTauriEmitter = (): EventEmitter => ({
  emit: async <K extends keyof EventMap>(eventType: K, payload: EventMap[K]) => {
    await tauriEmit(eventType as string, payload);
  },
  listen: async <K extends keyof EventMap>(
    eventType: K,
    handler: EventListener<EventMap[K]>
  ) => {
    const unlisten = await tauriListen<EventMap[K]>(eventType as string, (event) => {
      handler(event.payload);
    });
    return unlisten;
  },
});

// Stub web event emitter (for future implementation)
const createWebEmitter = (): EventEmitter => ({
  emit: async <K extends keyof EventMap>(eventType: K, payload: EventMap[K]) => {
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

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    events.listen(eventType, handler).then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [eventType, handler, events]);
};
