import { DIRECTION_IDS, type DirectionId } from "@/lib/directions";

export const NEXT_STEP_STORAGE_KEY = "siguiente-paso:selection:v1";

export type NextStep = {
  directionId: DirectionId;
  title: string;
  description: string;
  estimatedMinutes: 15 | 20;
  timeHorizon: "today" | "24-48-hours";
  costMxn: 0;
  simulated: true;
};

const NEXT_STEPS: Record<DirectionId, NextStep> = {
  "operations-support": {
    directionId: "operations-support",
    title: "Ordena cinco pendientes de práctica",
    description: "En una hoja, inventa cinco pendientes sencillos. Anota cuál vence primero, qué información falta y ordénalos del 1 al 5.",
    estimatedMinutes: 15,
    timeHorizon: "today",
    costMxn: 0,
    simulated: true,
  },
  "inventory-control": {
    directionId: "inventory-control",
    title: "Crea un inventario simulado de diez productos",
    description: "En una hoja, escribe diez productos inventados y agrega tres columnas: cantidad esperada, cantidad contada y diferencia.",
    estimatedMinutes: 20,
    timeHorizon: "today",
    costMxn: 0,
    simulated: true,
  },
  "customer-followup": {
    directionId: "customer-followup",
    title: "Redacta tres avisos de seguimiento",
    description: "Escribe tres mensajes breves para pedidos inventados: uno listo, uno retrasado y uno con información pendiente.",
    estimatedMinutes: 15,
    timeHorizon: "today",
    costMxn: 0,
    simulated: true,
  },
};

export function getNextStep(value: unknown): NextStep | null {
  if (typeof value !== "string" || !DIRECTION_IDS.includes(value as DirectionId)) return null;
  return NEXT_STEPS[value as DirectionId];
}

export function serializeLocalSelection(directionId: DirectionId): string {
  return JSON.stringify({ directionId });
}

export function parseLocalSelection(value: string | null): DirectionId | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (Object.keys(record).length !== 1 || !("directionId" in record)) return null;
    return getNextStep(record.directionId)?.directionId ?? null;
  } catch {
    return null;
  }
}

type LocalSelectionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function restoreLocalSelection(storage: LocalSelectionStorage): DirectionId | null {
  try {
    const stored = storage.getItem(NEXT_STEP_STORAGE_KEY);
    const restored = parseLocalSelection(stored);
    if (stored && !restored) {
      try {
        storage.removeItem(NEXT_STEP_STORAGE_KEY);
      } catch {
        // The invalid value remains inaccessible, but is never trusted.
      }
    }
    return restored;
  } catch {
    return null;
  }
}

export function saveLocalSelection(storage: LocalSelectionStorage, directionId: DirectionId): boolean {
  try {
    storage.setItem(NEXT_STEP_STORAGE_KEY, serializeLocalSelection(directionId));
    return true;
  } catch {
    return false;
  }
}

export function removeLocalSelection(storage: LocalSelectionStorage): boolean {
  try {
    storage.removeItem(NEXT_STEP_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
