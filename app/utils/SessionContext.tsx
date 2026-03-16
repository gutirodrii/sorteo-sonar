import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  createUser,
  getUserState,
  trackScreen,
  throwDice,
  updateUserState,
  claimFirstThrow,
  UserNotFoundError,
  PulseraAlreadyRegisteredError,
  type UserState,
  type ThrowDiceResponse,
  type ClaimFirstResponse,
} from "./api";

export type DiceRoll = {
  value: number;
  timestamp: number;
};

export type TreatmentConfig = {
  referenceSampleSize: 10 | 100;
  dishonestyLevelPct: 25 | 50 | 75;
  displayedShareFivePct: number;
};

export type ParticipantSession = {
  userId: number | null; // ID entero del usuario en la base de datos
  pulseraId: string | null; // Código de la pulsera (para display y recuperación)
  userState: UserState | null; // Estado actual del usuario en la API
  consentAccepted: boolean;
  hasCompleted: boolean;
  seriesIndex: number;
  treatment: TreatmentConfig | null;
  diceRolls: DiceRoll[];
  firstValidRoll: number | null;
  reportedValue: number | null;
  tickets: number;
  incentiveAwarded: boolean;
  telemetry: TelemetryBuffer;
  currentScreen: ScreenName | null;
};

export type ScreenName = "screen1" | "screen2" | "screen3";

export type TelemetryEvent = {
  type: "view" | "click" | "time" | "custom";
  name: string;
  timestamp: number;
  payload?: Record<string, unknown>;
};

export type TelemetryBuffer = {
  events: TelemetryEvent[];
};

export type VerifyUserResult =
  | {
      success: true;
      state: UserState;
    }
  | {
      success: false;
      error: string;
      isNotFound: boolean;
    };

type SessionContextValue = {
  session: ParticipantSession;
  isVerifying: boolean;
  verifyUser: (userId: string) => Promise<VerifyUserResult>;
  trackScreenNavigation: (screenName: ScreenName) => Promise<void>;
  rollDice: () => Promise<ThrowDiceResponse>;
  submitClaim: (claimedValue: number) => Promise<ClaimFirstResponse>;
  updateState: (state: UserState) => Promise<void>;
  setConsent: (accepted: boolean) => void;
  setTreatment: (t: TreatmentConfig) => void;
  addDiceRoll: (value: number) => void;
  markFirstValid: (value: number) => void;
  setReportedValue: (value: number) => void;
  finalizeIncentive: (tickets: number, awarded: boolean) => void;
  markCompleted: () => void;
  pushTelemetry: (event: TelemetryEvent) => void;
  resetSession: () => void;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

function computeTickets(value: number | null): number {
  if (value == null) return 0;
  switch (value) {
    case 1:
      return 10;
    case 2:
      return 20;
    case 3:
      return 30;
    case 4:
      return 40;
    case 5:
      return 50;
    case 6:
      return 0;
    default:
      return 0;
  }
}

const INITIAL_SESSION: ParticipantSession = {
  userId: null,
  pulseraId: null,
  userState: null,
  consentAccepted: false,
  hasCompleted: false,
  seriesIndex: 0,
  treatment: null,
  diceRolls: [],
  firstValidRoll: null,
  reportedValue: null,
  tickets: 0,
  incentiveAwarded: false,
  telemetry: { events: [] },
  currentScreen: null,
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isVerifying, setIsVerifying] = useState(false);

  const initialSession = useMemo<ParticipantSession>(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("ss_session") : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ParticipantSession;
        return { ...parsed, telemetry: { events: [] } };
      } catch {}
    }
    return INITIAL_SESSION;
  }, []);

  const [session, setSession] = useState<ParticipantSession>(initialSession);

  const persistRef = useRef<number | null>(null);
  const persist = useCallback((next: ParticipantSession) => {
    setSession(next);
    if (typeof window !== "undefined") {
      if (persistRef.current) window.clearTimeout(persistRef.current);
      persistRef.current = window.setTimeout(() => {
        const { telemetry, ...rest } = next;
        localStorage.setItem("ss_session", JSON.stringify(rest));
      }, 50);
    }
  }, []);

  // Referencia al session actual para usar en callbacks
  // useLayoutEffect garantiza que el ref esté actualizado antes que cualquier
  // useEffect de componentes hijos (los effects se ejecutan hijo→padre, pero
  // useLayoutEffect siempre corre antes que useEffect en todos los componentes).
  const sessionRef = useRef(session);
  useLayoutEffect(() => {
    sessionRef.current = session;
  }, [session]);

  /**
   * Verificar/registrar usuario por su código de pulsera
   * Llama a POST /users/ para crear el usuario (si no existe) y obtener el integer user_id.
   * Si la pulsera ya está registrada, intenta recuperar la sesión almacenada localmente.
   */
  const verifyUser = useCallback(
    async (pulseraId: string): Promise<VerifyUserResult> => {
      setIsVerifying(true);
      try {
        // Intentar crear el usuario en la API
        const createResponse = await createUser(pulseraId);
        const newSession = {
          ...sessionRef.current,
          userId: createResponse.id,
          pulseraId,
          userState: createResponse.state as UserState,
          hasCompleted: createResponse.state === 2,
        };
        persist(newSession);
        console.log(
          "[API] Usuario creado:",
          createResponse.id,
          "Estado:",
          createResponse.state,
        );
        return { success: true, state: createResponse.state as UserState };
      } catch (error) {
        // Pulsera ya registrada: intentar recuperar sesión almacenada
        if (error instanceof PulseraAlreadyRegisteredError) {
          const stored =
            typeof window !== "undefined"
              ? localStorage.getItem("ss_session")
              : null;
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as ParticipantSession;
              if (parsed.pulseraId === pulseraId && parsed.userId !== null) {
                const stateResponse = await getUserState(parsed.userId);
                const recoveredSession = {
                  ...parsed,
                  userState: stateResponse.state,
                  hasCompleted: stateResponse.state === 2,
                  telemetry: { events: [] },
                };
                persist(recoveredSession);
                console.log(
                  "[API] Sesión recuperada para pulsera:",
                  pulseraId,
                  "Estado:",
                  stateResponse.state,
                );
                return { success: true, state: stateResponse.state };
              }
            } catch (recoverError) {
              console.error("[API] Error recuperando sesión:", recoverError);
            }
          }
          return {
            success: false,
            error:
              "Esta pulsera ya fue registrada. Si participaste antes, utiliza el mismo dispositivo.",
            isNotFound: false,
          };
        }

        console.error("[API] Error verificando usuario:", error);

        if (error instanceof UserNotFoundError) {
          return { success: false, error: error.message, isNotFound: true };
        }

        const message =
          error instanceof Error ? error.message : "Error desconocido";
        return { success: false, error: message, isNotFound: false };
      } finally {
        setIsVerifying(false);
      }
    },
    [persist],
  );

  // Trackear navegación de pantallas
  const trackScreenNavigation = useCallback(
    async (screenName: ScreenName): Promise<void> => {
      const userId = sessionRef.current.userId;
      if (!userId) {
        console.warn("[API] No hay userId para trackear pantalla");
        return;
      }

      try {
        await trackScreen(userId, screenName);
        const newSession = { ...sessionRef.current, currentScreen: screenName };
        persist(newSession);
        console.log("[API] Pantalla trackeada:", screenName);
      } catch (error) {
        console.error("[API] Error trackeando pantalla:", error);
      }
    },
    [persist],
  );

  // Lanzar dado via API
  const rollDice = useCallback(async (): Promise<ThrowDiceResponse> => {
    const userId = sessionRef.current.userId;
    if (!userId) {
      throw new Error("No hay userId para lanzar dado");
    }

    try {
      const response = await throwDice(userId);
      console.log("[API] Dado lanzado:", response.value);

      // Actualizar estado local con el resultado
      const roll: DiceRoll = { value: response.value, timestamp: Date.now() };
      const newDiceRolls = [...sessionRef.current.diceRolls, roll];

      let newSession = {
        ...sessionRef.current,
        diceRolls: newDiceRolls,
        userState: 1 as UserState, // Ahora el usuario ya tiró
      };

      // Si es la primera tirada válida, marcarla
      if (sessionRef.current.firstValidRoll === null) {
        const tickets = computeTickets(response.value);
        newSession = { ...newSession, firstValidRoll: response.value, tickets };
      }

      persist(newSession);
      return response;
    } catch (error) {
      console.error("[API] Error lanzando dado:", error);
      throw error;
    }
  }, [persist]);

  // Enviar claim de primera tirada
  const submitClaim = useCallback(
    async (claimedValue: number): Promise<ClaimFirstResponse> => {
      const userId = sessionRef.current.userId;
      if (!userId) {
        throw new Error("No hay userId para reclamar valor");
      }

      try {
        const response = await claimFirstThrow(userId, claimedValue);
        console.log(
          "[API] Valor reclamado:",
          claimedValue,
          "Valor real:",
          response.true_value,
        );

        const newSession = {
          ...sessionRef.current,
          reportedValue: claimedValue,
          userState: 2 as UserState, // Usuario ha completado
          hasCompleted: true,
        };
        persist(newSession);

        return response;
      } catch (error) {
        console.error("[API] Error reclamando valor:", error);
        throw error;
      }
    },
    [persist],
  );

  // Actualizar estado del usuario
  const updateState = useCallback(
    async (state: UserState): Promise<void> => {
      const userId = sessionRef.current.userId;
      if (!userId) {
        console.warn("[API] No hay userId para actualizar estado");
        return;
      }

      try {
        await updateUserState(userId, state);
        const newSession = { ...sessionRef.current, userState: state };
        persist(newSession);
        console.log("[API] Estado actualizado:", state);
      } catch (error) {
        console.error("[API] Error actualizando estado:", error);
      }
    },
    [persist],
  );

  // Resetear sesión (para nuevo usuario)
  const resetSession = useCallback(() => {
    persist(INITIAL_SESSION);
    if (typeof window !== "undefined") {
      localStorage.removeItem("ss_session");
    }
  }, [persist]);

  // Push telemetry event - usando useCallback para evitar re-renders infinitos
  const pushTelemetry = useCallback((event: TelemetryEvent) => {
    setSession((prev) => ({
      ...prev,
      telemetry: { events: [...prev.telemetry.events, event] },
    }));
  }, []);

  const setConsent = useCallback(
    (accepted: boolean) => {
      persist({ ...sessionRef.current, consentAccepted: accepted });
    },
    [persist],
  );

  const setTreatment = useCallback(
    (t: TreatmentConfig) => {
      persist({ ...sessionRef.current, treatment: t });
    },
    [persist],
  );

  const addDiceRoll = useCallback(
    (value: number) => {
      const roll: DiceRoll = { value, timestamp: Date.now() };
      persist({
        ...sessionRef.current,
        diceRolls: [...sessionRef.current.diceRolls, roll],
      });
    },
    [persist],
  );

  const markFirstValid = useCallback(
    (value: number) => {
      const tickets = computeTickets(value);
      persist({ ...sessionRef.current, firstValidRoll: value, tickets });
    },
    [persist],
  );

  const setReportedValue = useCallback(
    (value: number) => {
      persist({ ...sessionRef.current, reportedValue: value });
    },
    [persist],
  );

  const finalizeIncentive = useCallback(
    (tickets: number, awarded: boolean) => {
      persist({ ...sessionRef.current, tickets, incentiveAwarded: awarded });
    },
    [persist],
  );

  const markCompleted = useCallback(() => {
    persist({ ...sessionRef.current, hasCompleted: true });
  }, [persist]);

  const value: SessionContextValue = {
    session,
    isVerifying,
    verifyUser,
    trackScreenNavigation,
    rollDice,
    submitClaim,
    updateState,
    setConsent,
    setTreatment,
    addDiceRoll,
    markFirstValid,
    setReportedValue,
    finalizeIncentive,
    markCompleted,
    pushTelemetry,
    resetSession,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
