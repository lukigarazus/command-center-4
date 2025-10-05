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
import type { EventEmitter, EventListener } from "../types/events";
import { isTauri } from "@tauri-apps/api/core";

const EventContext = createContext<EventEmitter | null>(null);

// Detect if we're running in Tauri context
const isTauriContext = () => {
  return isTauri();
};

// Tauri event emitter implementation
const createTauriEmitter = (): EventEmitter => ({
  emit: async <T,>(eventType: string, payload: T) => {
    await tauriEmit(eventType, payload);
  },
  listen: async <T,>(eventType: string, handler: EventListener<T>) => {
    const unlisten = await tauriListen<T>(eventType, (event) => {
      handler(event.payload);
    });
    return unlisten;
  },
});

// Stub web event emitter (for future implementation)
const createWebEmitter = (): EventEmitter => ({
  emit: async <T,>(eventType: string, payload: T) => {
    console.log("[WebEmitter] Emit not implemented:", eventType, payload);
  },
  listen: async <T,>(eventType: string, handler: EventListener<T>) => {
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
export const useEventListener = <T,>(
  eventType: string,
  handler: EventListener<T>
) => {
  const events = useEvents();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    events.listen<T>(eventType, handler).then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [eventType, handler, events]);
};
