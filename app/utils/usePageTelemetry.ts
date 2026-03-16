import { useEffect, useRef } from "react";
import { useSession } from "./SessionContext";

export function usePageTelemetry(pageName: string) {
  const { pushTelemetry } = useSession();
  const mountTimeRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    mountTimeRef.current = now;
    pushTelemetry({ type: "view", name: pageName, timestamp: now });
    return () => {
      const duration = Date.now() - mountTimeRef.current;
      pushTelemetry({ type: "time", name: `${pageName}_duration_ms`, timestamp: Date.now(), payload: { duration } });
    };
  }, [pageName, pushTelemetry]);

  const trackClick = (name: string, payload?: Record<string, unknown>) => {
    pushTelemetry({ type: "click", name: `${pageName}_${name}`, timestamp: Date.now(), payload });
  };

  return { trackClick };
}



