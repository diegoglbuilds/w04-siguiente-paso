export const ACTIVITY_TYPES = ["organize", "solve", "plan"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const FIRST_TASK_OPTIONS = [
  "complete-today-order",
  "attend-waiting-customer",
  "clarify-incomplete-order",
  "prepare-tomorrow-delivery",
] as const;
export type FirstTaskAnswer = (typeof FIRST_TASK_OPTIONS)[number];

export const MISSING_INFO_OPTIONS = [
  "confirm-missing-products",
  "guess-missing-products",
  "leave-order-unchanged",
] as const;
export type MissingInfoAnswer = (typeof MISSING_INFO_OPTIONS)[number];

export const UPDATE_OPTIONS = [
  "notify-and-record",
  "continue-without-notice",
  "wait-until-end",
] as const;
export type UpdateAnswer = (typeof UPDATE_OPTIONS)[number];

export type OrganizeAnswers = {
  firstTask: FirstTaskAnswer;
  missingInfo: MissingInfoAnswer;
  updateAction: UpdateAnswer;
};

export type DemonstratedSignal =
  | "prioritization"
  | "information-check"
  | "follow-through";

export type ActivityResult = {
  activity: "organize";
  simulated: true;
  answers: OrganizeAnswers;
  demonstratedSignals: DemonstratedSignal[];
};

type ValidationResult =
  | { success: true; data: OrganizeAnswers }
  | { success: false; error: string };

const hasOnlyKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => key in value);

export function validateOrganizeAnswers(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "Las respuestas no tienen el formato esperado." };
  }

  const answers = value as Record<string, unknown>;
  if (!hasOnlyKeys(answers, ["firstTask", "missingInfo", "updateAction"])) {
    return { success: false, error: "Las respuestas incluyen campos no permitidos." };
  }
  if (!FIRST_TASK_OPTIONS.includes(answers.firstTask as FirstTaskAnswer)) {
    return { success: false, error: "La primera prioridad no es válida." };
  }
  if (!MISSING_INFO_OPTIONS.includes(answers.missingInfo as MissingInfoAnswer)) {
    return { success: false, error: "La revisión de información no es válida." };
  }
  if (!UPDATE_OPTIONS.includes(answers.updateAction as UpdateAnswer)) {
    return { success: false, error: "La acción de seguimiento no es válida." };
  }

  return { success: true, data: answers as OrganizeAnswers };
}

export function calculateOrganizeResult(value: unknown): ActivityResult | null {
  const validated = validateOrganizeAnswers(value);
  if (!validated.success) return null;

  const signals: DemonstratedSignal[] = ["prioritization"];
  if (validated.data.missingInfo === "confirm-missing-products") {
    signals.push("information-check");
  }
  if (validated.data.updateAction === "notify-and-record") {
    signals.push("follow-through");
  }

  return {
    activity: "organize",
    simulated: true,
    answers: validated.data,
    demonstratedSignals: signals,
  };
}
