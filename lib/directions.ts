import {
  calculateOrganizeResult,
  type ActivityResult,
  type DemonstratedSignal,
} from "@/lib/activity";

export const DIRECTION_IDS = [
  "operations-support",
  "inventory-control",
  "customer-followup",
] as const;
export type DirectionId = (typeof DIRECTION_IDS)[number];

export const CONFIDENCE_LABELS = ["low", "medium", "demo"] as const;
export type ConfidenceLabel = (typeof CONFIDENCE_LABELS)[number];

export type DirectionPossibility = {
  id: DirectionId;
  title: string;
  reason: string;
  confidenceLabel: ConfidenceLabel;
  limitations: string;
};

export type DirectionsProvenance = "ai" | "fallback";

export type DirectionsResponse = {
  possibilities: DirectionPossibility[];
  provenance: DirectionsProvenance;
  evidence: ActivityResult;
};

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const TITLES: Record<DirectionId, string> = {
  "operations-support": "Apoyo en operaciones",
  "inventory-control": "Control de inventario",
  "customer-followup": "Seguimiento de pedidos",
};

const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => key in value);

const isExactSignalList = (
  received: unknown,
  expected: DemonstratedSignal[],
) =>
  Array.isArray(received) &&
  received.length === expected.length &&
  received.every((signal, index) => signal === expected[index]);

export function validateActivityResultRequest(
  value: unknown,
): ValidationResult<ActivityResult> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "La solicitud no tiene el formato esperado." };
  }
  const request = value as Record<string, unknown>;
  if (!hasOnlyKeys(request, ["activityResult"])) {
    return { success: false, error: "La solicitud incluye campos no permitidos." };
  }
  const candidate = request.activityResult;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { success: false, error: "El resultado de actividad no es válido." };
  }
  const result = candidate as Record<string, unknown>;
  if (!hasOnlyKeys(result, ["activity", "simulated", "answers", "demonstratedSignals"])) {
    return { success: false, error: "El resultado incluye campos no permitidos." };
  }
  if (result.activity !== "organize" || result.simulated !== true) {
    return { success: false, error: "La actividad no está permitida." };
  }

  const authoritative = calculateOrganizeResult(result.answers);
  if (!authoritative || !isExactSignalList(result.demonstratedSignals, authoritative.demonstratedSignals)) {
    return { success: false, error: "Las señales no coinciden con las respuestas validadas." };
  }

  return { success: true, data: authoritative };
}

const hasSafeText = (value: unknown, maxLength: number) => {
  if (typeof value !== "string" || value.trim().length < 8 || value.length > maxLength) return false;
  return !/(employability|future.?potential|puntaje|score|carrera correcta|debes trabajar|empleo garantizado|garantiza(?:r|do)? empleo)/i.test(value);
};

export function validateDirectionOutput(
  value: unknown,
): ValidationResult<DirectionPossibility[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "La respuesta del modelo no es un objeto." };
  }
  const wrapper = value as Record<string, unknown>;
  if (!hasOnlyKeys(wrapper, ["possibilities"]) || !Array.isArray(wrapper.possibilities)) {
    return { success: false, error: "La respuesta del modelo incluye campos no permitidos." };
  }
  if (wrapper.possibilities.length < 2 || wrapper.possibilities.length > 3) {
    return { success: false, error: "Se requieren entre dos y tres posibilidades." };
  }

  const ids = new Set<string>();
  for (const item of wrapper.possibilities) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { success: false, error: "Una posibilidad no es válida." };
    }
    const possibility = item as Record<string, unknown>;
    if (!hasOnlyKeys(possibility, ["id", "title", "reason", "confidenceLabel", "limitations"])) {
      return { success: false, error: "Una posibilidad incluye campos no permitidos." };
    }
    if (!DIRECTION_IDS.includes(possibility.id as DirectionId) || ids.has(possibility.id as string)) {
      return { success: false, error: "El identificador de posibilidad no es válido." };
    }
    const id = possibility.id as DirectionId;
    if (possibility.title !== TITLES[id]) {
      return { success: false, error: "El título no coincide con el catálogo permitido." };
    }
    if (!CONFIDENCE_LABELS.includes(possibility.confidenceLabel as ConfidenceLabel)) {
      return { success: false, error: "La confianza no es válida." };
    }
    if (!hasSafeText(possibility.reason, 240) || !hasSafeText(possibility.limitations, 240)) {
      return { success: false, error: "La explicación incumple los límites de seguridad." };
    }
    ids.add(id);
  }

  return { success: true, data: wrapper.possibilities as DirectionPossibility[] };
}

export function getFallbackDirections(result: ActivityResult): DirectionPossibility[] {
  const has = (signal: DemonstratedSignal) => result.demonstratedSignals.includes(signal);
  return [
    {
      id: "operations-support",
      title: TITLES["operations-support"],
      reason: "Aparece porque comparaste pendientes y elegiste qué atender primero en la simulación.",
      confidenceLabel: "demo",
      limitations: "Una actividad breve no muestra cómo actuarías en todas las situaciones de operación.",
    },
    {
      id: "inventory-control",
      title: TITLES["inventory-control"],
      reason: has("information-check")
        ? "Aparece porque confirmaste información faltante antes de continuar con un pedido."
        : "Aparece como una posibilidad para practicar la revisión ordenada de productos y datos.",
      confidenceLabel: "demo",
      limitations: "No se evaluaron herramientas de inventario, experiencia previa ni trabajo real.",
    },
    {
      id: "customer-followup",
      title: TITLES["customer-followup"],
      reason: has("follow-through")
        ? "Aparece porque elegiste avisar cambios y dejar registro después de organizar los pendientes."
        : "Aparece como una posibilidad para explorar seguimiento claro después de ordenar tareas.",
      confidenceLabel: "demo",
      limitations: "La simulación no evaluó conversaciones reales ni determina afinidad profesional.",
    },
  ];
}

export function validateDirectionsResponse(
  value: unknown,
  expectedEvidence: ActivityResult,
): DirectionsResponse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const response = value as Record<string, unknown>;
  if (!hasOnlyKeys(response, ["possibilities", "provenance", "evidence"])) return null;
  if (response.provenance !== "ai" && response.provenance !== "fallback") return null;
  const possibilities = validateDirectionOutput({ possibilities: response.possibilities });
  const evidence = validateActivityResultRequest({ activityResult: response.evidence });
  if (!possibilities.success || !evidence.success) return null;
  if (JSON.stringify(evidence.data) !== JSON.stringify(expectedEvidence)) return null;
  return { possibilities: possibilities.data, provenance: response.provenance, evidence: evidence.data };
}

export const DIRECTION_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["possibilities"],
  properties: {
    possibilities: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "reason", "confidenceLabel", "limitations"],
        properties: {
          id: { type: "string", enum: DIRECTION_IDS },
          title: { type: "string", enum: Object.values(TITLES) },
          reason: { type: "string", minLength: 8, maxLength: 240 },
          confidenceLabel: { type: "string", enum: CONFIDENCE_LABELS },
          limitations: { type: "string", minLength: 8, maxLength: 240 },
        },
      },
    },
  },
} as const;
