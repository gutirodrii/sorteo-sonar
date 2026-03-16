// API Client para FastAPI Backend
// Base URL configurable para desarrollo/producción
const envUrl = import.meta.env.API_BASE_URL || import.meta.env.VITE_API_URL;
const API_BASE_URL = envUrl
  ? envUrl.replace(/\/$/, "")
  : "http://127.0.0.1:8000";

// ============================================
// Tipos de respuesta de la API
// ============================================

/**
 * Estado del usuario:
 * - 0: No ha lanzado el dado
 * - 1: Ya lanzó pero no reportó el resultado
 * - 2: Ya reportó el resultado (finalizado)
 */
export type UserState = 0 | 1 | 2;

export type CreateUserResponse = {
  id: number;
  pulsera_id: string;
  state: number;
  group_id: number | null;
};

export type GetUserStateResponse = {
  state: UserState;
};

export type ThrowDiceResponse = {
  id: number;
  user_id: number;
  value: number;
  throw_time: string;
};

export type ClaimFirstResponse = {
  id: number;
  user_id: number;
  true_value: number;
  claimed_value: number;
};

export type ApiError = {
  detail: string;
};

// ============================================
// Errores personalizados
// ============================================

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class PulseraAlreadyRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PulseraAlreadyRegisteredError";
  }
}

// ============================================
// Funciones de API
// ============================================

/**
 * Crear un usuario nuevo a partir de un pulsera_id
 * POST /users/
 *
 * Respuestas:
 * - 200: User creado { id, pulsera_id, state, group_id }
 * - 400: "Pulsera ID does not exist" → pulsera inválida
 * - 400: "Pulsera already registered" → ya existe un usuario con esa pulsera
 */
export async function createUser(pulseraId: string): Promise<CreateUserResponse> {
  const response = await fetch(`${API_BASE_URL}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pulsera_id: pulseraId }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Error al crear usuario" }));

    if (response.status === 400) {
      if (error.detail === "Pulsera ID does not exist") {
        throw new UserNotFoundError("Código de pulsera inválido");
      }
      if (error.detail === "Pulsera already registered") {
        throw new PulseraAlreadyRegisteredError(error.detail);
      }
    }
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtener el estado de un usuario por su ID entero
 * GET /users/{user_id}/state
 *
 * Respuestas:
 * - 200: bare integer 0 | 1 | 2  (la API devuelve user.state directamente)
 * - 404: Usuario no encontrado
 */
export async function getUserState(
  userId: number,
): Promise<GetUserStateResponse> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/state`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new UserNotFoundError("Usuario no encontrado");
    }
    const error = await response
      .json()
      .catch(() => ({ detail: "Error al verificar usuario" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // La API devuelve un entero bare (user.state), no { state: int }
  const stateValue = await response.json();
  return { state: stateValue as UserState };
}

/**
 * Trackear navegación entre pantallas
 * POST /users/{user_id}/screens
 * screen_name: "screen1" | "screen2" | "screen3"
 */
export async function trackScreen(
  userId: number,
  screenName: "screen1" | "screen2" | "screen3",
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/screens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ screen_name: screenName }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Error al trackear pantalla" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
}

/**
 * Lanzar dado - el backend devuelve el resultado
 * POST /users/{user_id}/throw
 */
export async function throwDice(userId: number): Promise<ThrowDiceResponse> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/throw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Error al lanzar dado" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Actualizar estado del usuario
 * PATCH /users/{user_id}/state
 * state: 0 = inicio, 1 = jugando, 2 = finalizado
 */
export async function updateUserState(
  userId: number,
  state: UserState,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/state`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Error al actualizar estado" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
}

/**
 * Reclamar el valor de la primera tirada
 * POST /users/{user_id}/claim-first
 *
 * Errores posibles:
 * - 404: Usuario no existe
 * - 400: Usuario ya reclamó o no ha tirado nunca
 */
export async function claimFirstThrow(
  userId: number,
  claimedValue: number,
): Promise<ClaimFirstResponse> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/claim-first`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimed_value: claimedValue }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Error al reclamar valor" }));

    if (response.status === 404) {
      throw new UserNotFoundError("Usuario no encontrado");
    }
    if (response.status === 400) {
      throw new Error(
        error.detail || "Ya has reclamado tu valor o no has tirado el dado",
      );
    }

    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// Tipos legacy (mantener compatibilidad)
// ============================================

export type TreatmentResponse = {
  referenceSampleSize: 10 | 100;
  dishonestyLevelPct: 25 | 50 | 75;
  displayedShareFivePct: number;
  seriesIndex: number;
};

export type TelemetryPayload = {
  anonymousId: string | null;
  seriesIndex: number;
  events: Array<{
    type: string;
    name: string;
    timestamp: number;
    payload?: unknown;
  }>;
};

// Funciones legacy (stubs por ahora)
export async function fetchTreatment(): Promise<TreatmentResponse> {
  await artificialDelay();
  const sizes: Array<10 | 100> = [10, 100];
  const levels: Array<25 | 50 | 75> = [25, 50, 75];
  const referenceSampleSize = sizes[Math.floor(Math.random() * sizes.length)];
  const dishonestyLevelPct = levels[Math.floor(Math.random() * levels.length)];
  const displayedShareFivePct = dishonestyLevelPct;
  const seriesIndex = Math.floor(Math.random() * 10);
  return {
    referenceSampleSize,
    dishonestyLevelPct,
    displayedShareFivePct,
    seriesIndex,
  };
}

export async function postTelemetry(
  payload: TelemetryPayload,
): Promise<{ ok: true }> {
  await artificialDelay();
  console.debug("[telemetry]", payload);
  return { ok: true };
}

async function artificialDelay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms));
}
