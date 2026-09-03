"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  calculateOrganizeResult,
  type ActivityResult,
  type OrganizeAnswers,
} from "@/lib/activity";
import {
  getFallbackDirections,
  validateDirectionsResponse,
  type DirectionsResponse,
} from "@/lib/directions";
import {
  getNextStep,
  NEXT_STEP_STORAGE_KEY,
  parseLocalSelection,
  serializeLocalSelection,
} from "@/lib/next-step";
import type { DirectionId } from "@/lib/directions";

type Screen = "selection" | "activity" | "result";

const INITIAL_ANSWERS: OrganizeAnswers = {
  firstTask: "complete-today-order",
  missingInfo: "confirm-missing-products",
  updateAction: "notify-and-record",
};

const SIGNAL_COPY: Record<ActivityResult["demonstratedSignals"][number], { title: string; detail: string }> = {
  prioritization: { title: "Comparaste prioridades", detail: "Elegiste una primera acción entre pendientes con distinta urgencia." },
  "information-check": { title: "Detectaste información faltante", detail: "Preferiste confirmar datos antes de continuar con un pedido incompleto." },
  "follow-through": { title: "Consideraste el seguimiento", detail: "Incluiste avisar y dejar registro después de organizar la atención." },
};

export default function ActivityFlow() {
  const [screen, setScreen] = useState<Screen>("selection");
  const [answers, setAnswers] = useState<OrganizeAnswers>(INITIAL_ANSWERS);
  const [result, setResult] = useState<ActivityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);
  const [selectedDirectionId, setSelectedDirectionId] = useState<DirectionId | null>(null);
  const [restoredDirectionId, setRestoredDirectionId] = useState<DirectionId | null>(null);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(NEXT_STEP_STORAGE_KEY);
      const restored = parseLocalSelection(stored);
      if (stored && !restored) window.localStorage.removeItem(NEXT_STEP_STORAGE_KEY);
      setRestoredDirectionId(restored);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  const updateAnswer = <Key extends keyof OrganizeAnswers>(key: Key, value: OrganizeAnswers[Key]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const submitActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextResult = calculateOrganizeResult(answers);
    if (!nextResult) {
      setError("No pudimos validar esas respuestas. Revisa tus opciones e inténtalo de nuevo.");
      return;
    }
    setResult(nextResult);
    setDirections(null);
    setSelectedDirectionId(null);
    setScreen("result");
  };

  const chooseDirection = (directionId: DirectionId) => {
    if (!directions?.possibilities.some((possibility) => possibility.id === directionId)) return;
    setSelectedDirectionId(directionId);
    setRestoredDirectionId(directionId);
    window.localStorage.setItem(NEXT_STEP_STORAGE_KEY, serializeLocalSelection(directionId));
  };

  const clearRestoredSelection = () => {
    window.localStorage.removeItem(NEXT_STEP_STORAGE_KEY);
    setRestoredDirectionId(null);
    setSelectedDirectionId(null);
  };

  const selectedNextStep = selectedDirectionId ? getNextStep(selectedDirectionId) : null;
  const restoredNextStep = restoredDirectionId ? getNextStep(restoredDirectionId) : null;

  const loadDirections = async () => {
    if (!result) return;
    setIsLoadingDirections(true);
    try {
      const response = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityResult: result }),
      });
      if (!response.ok) throw new Error("invalid response");
      const validated = validateDirectionsResponse(await response.json(), result);
      if (!validated) throw new Error("invalid contract");
      setDirections(validated);
    } catch {
      setDirections({ possibilities: getFallbackDirections(result), provenance: "fallback", evidence: result });
    } finally {
      setIsLoadingDirections(false);
    }
  };

  return (
    <section className="activity-shell" id="actividades" aria-labelledby="activity-title">
      {screen === "selection" && (
        <div className="activity-panel">
          {restoredNextStep && (
            <aside className="restored-step" aria-label="Siguiente paso guardado">
              <span className="saved-label">Guardado en este dispositivo</span>
              <h3>{restoredNextStep.title}</h3>
              <p>{restoredNextStep.description}</p>
              <div className="step-facts"><span>Hoy</span><span>{restoredNextStep.estimatedMinutes} minutos</span><span>Costo: $0 MXN</span></div>
              <button className="text-button" type="button" onClick={clearRestoredSelection}>Cambiar esta elección</button>
            </aside>
          )}
          <div className="section-heading compact-heading">
            <p className="eyebrow">Actividad breve</p>
            <h2 id="activity-title">¿Qué te gustaría intentar hoy?</h2>
            <p>Elige una actividad simulada. No necesitas contar nada sobre tu historia.</p>
          </div>
          <div className="activity-grid">
            <button className="activity-option available" type="button" onClick={() => setScreen("activity")}>
              <span className="activity-icon purple" aria-hidden="true">✓</span>
              <span><strong>Organizar</strong><small>Ordena pendientes y decide qué atender primero.</small><em>Disponible · 3 minutos</em></span>
              <span className="option-arrow" aria-hidden="true">→</span>
            </button>
            <div className="activity-option unavailable" aria-disabled="true">
              <span className="activity-icon teal" aria-hidden="true">◇</span>
              <span><strong>Resolver</strong><small>Toma decisiones ante una situación breve.</small><em>Disponible próximamente</em></span>
            </div>
            <div className="activity-option unavailable" aria-disabled="true">
              <span className="activity-icon orange" aria-hidden="true">□</span>
              <span><strong>Planear</strong><small>Organiza los pasos de una jornada.</small><em>Disponible próximamente</em></span>
            </div>
          </div>
          <p className="selection-privacy">Sin cuenta, sin datos personales y sin guardar tus respuestas.</p>
        </div>
      )}

      {screen === "activity" && (
        <div className="activity-panel task-panel">
          <button className="back-button" type="button" onClick={() => setScreen("selection")}>← Elegir otra actividad</button>
          <div className="task-header">
            <span className="demo-badge">Actividad simulada · 3 minutos</span>
            <h2 id="activity-title">Organizar pendientes</h2>
            <p>Imagina una mesa de pedidos. No hay una calificación: sólo elige cómo actuarías en esta simulación.</p>
          </div>
          <form onSubmit={submitActivity} noValidate>
            <fieldset>
              <legend><span>1</span> ¿Qué atenderías primero?</legend>
              <label><input type="radio" name="firstTask" value="complete-today-order" checked={answers.firstTask === "complete-today-order"} onChange={() => updateAnswer("firstTask", "complete-today-order")} /><span><strong>Pedido que vence hoy</strong><small>Está completo y debe salir antes de las 5.</small></span></label>
              <label><input type="radio" name="firstTask" value="attend-waiting-customer" checked={answers.firstTask === "attend-waiting-customer"} onChange={() => updateAnswer("firstTask", "attend-waiting-customer")} /><span><strong>Cliente esperando</strong><small>Llegó a recoger un pedido ya preparado.</small></span></label>
              <label><input type="radio" name="firstTask" value="clarify-incomplete-order" checked={answers.firstTask === "clarify-incomplete-order"} onChange={() => updateAnswer("firstTask", "clarify-incomplete-order")} /><span><strong>Pedido incompleto</strong><small>Le faltan productos y vence mañana.</small></span></label>
              <label><input type="radio" name="firstTask" value="prepare-tomorrow-delivery" checked={answers.firstTask === "prepare-tomorrow-delivery"} onChange={() => updateAnswer("firstTask", "prepare-tomorrow-delivery")} /><span><strong>Entrega de mañana</strong><small>Está completa y aún tiene tiempo.</small></span></label>
            </fieldset>
            <fieldset>
              <legend><span>2</span> Para el pedido incompleto, ¿qué harías?</legend>
              <label><input type="radio" name="missingInfo" checked={answers.missingInfo === "confirm-missing-products"} onChange={() => updateAnswer("missingInfo", "confirm-missing-products")} /><span><strong>Confirmar qué productos faltan</strong></span></label>
              <label><input type="radio" name="missingInfo" checked={answers.missingInfo === "guess-missing-products"} onChange={() => updateAnswer("missingInfo", "guess-missing-products")} /><span><strong>Suponer qué productos faltan</strong></span></label>
              <label><input type="radio" name="missingInfo" checked={answers.missingInfo === "leave-order-unchanged"} onChange={() => updateAnswer("missingInfo", "leave-order-unchanged")} /><span><strong>Dejarlo sin revisar</strong></span></label>
            </fieldset>
            <fieldset>
              <legend><span>3</span> Después de ordenar los pendientes, ¿qué sigue?</legend>
              <label><input type="radio" name="updateAction" checked={answers.updateAction === "notify-and-record"} onChange={() => updateAnswer("updateAction", "notify-and-record")} /><span><strong>Avisar cambios y dejar registro</strong></span></label>
              <label><input type="radio" name="updateAction" checked={answers.updateAction === "continue-without-notice"} onChange={() => updateAnswer("updateAction", "continue-without-notice")} /><span><strong>Continuar sin avisar</strong></span></label>
              <label><input type="radio" name="updateAction" checked={answers.updateAction === "wait-until-end"} onChange={() => updateAnswer("updateAction", "wait-until-end")} /><span><strong>Esperar hasta el final del día</strong></span></label>
            </fieldset>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button submit-button" type="submit">Ver lo que demostré <span aria-hidden="true">→</span></button>
          </form>
        </div>
      )}

      {screen === "result" && result && (
        <div className="activity-panel result-panel">
          <span className="demo-badge">Resultado simulado</span>
          <p className="eyebrow">Lo que acabas de demostrar</p>
          <h2 id="activity-title">Tus decisiones mostraron estas señales.</h2>
          <p className="result-intro">Son observaciones de esta actividad, no una calificación ni una conclusión sobre ti.</p>
          <ul className="signal-list">
            {result.demonstratedSignals.map((signal) => <li key={signal}><span aria-hidden="true">✓</span><div><strong>{SIGNAL_COPY[signal].title}</strong><p>{SIGNAL_COPY[signal].detail}</p></div></li>)}
          </ul>
          {!directions && (
            <div className="directions-gate">
              <h3>¿Quieres ver algunas posibilidades?</h3>
              <p>Se basarán sólo en las señales estructuradas de esta actividad simulada.</p>
              <button className="primary-button" type="button" disabled={isLoadingDirections} onClick={loadDirections}>
                {isLoadingDirections ? "Buscando posibilidades…" : "Ver posibilidades"}
              </button>
            </div>
          )}
          {directions && (
            <section className="directions" aria-labelledby="directions-title">
              <div className="directions-heading">
                <span className={`provenance ${directions.provenance}`}>
                  {directions.provenance === "ai" ? "Posibilidades asistidas por IA" : "Posibilidades seguras de respaldo"}
                </span>
                <h3 id="directions-title">Posibles direcciones para explorar</h3>
                <p><strong>Son posibilidades, no decisiones.</strong> Una actividad simulada de tres minutos no puede determinar tu futuro.</p>
              </div>
              <div className="possibility-list">
                {directions.possibilities.map((possibility) => (
                  <article className="possibility-card" key={possibility.id}>
                    <div className="possibility-title"><h4>{possibility.title}</h4><span>{possibility.confidenceLabel === "demo" ? "Señal de demo" : `Confianza ${possibility.confidenceLabel === "medium" ? "media" : "baja"}`}</span></div>
                    <p><strong>¿Por qué apareció?</strong>{possibility.reason}</p>
                    <p className="limitation"><strong>Límite</strong>{possibility.limitations}</p>
                    <button
                      className="choose-button"
                      type="button"
                      aria-pressed={selectedDirectionId === possibility.id}
                      onClick={() => chooseDirection(possibility.id)}
                    >
                      {selectedDirectionId === possibility.id ? "Elegiste esta posibilidad" : `Elegir ${possibility.title}`}
                    </button>
                  </article>
                ))}
              </div>
              <aside className="uncertainty-note"><span aria-hidden="true">i</span><p>No evaluamos tu experiencia completa ni decidimos qué debes hacer. Tú conservarás todas las opciones.</p></aside>
              {!selectedNextStep && <p className="choice-prompt">Tú eliges cuál explorar. Ninguna está seleccionada automáticamente.</p>}
              {selectedNextStep && (
                <section className="next-step-card" aria-labelledby="next-step-title">
                  <span className="saved-label">Tu siguiente paso sugerido</span>
                  <h3 id="next-step-title">{selectedNextStep.title}</h3>
                  <p>{selectedNextStep.description}</p>
                  <div className="step-facts"><span>Para hoy</span><span>Tiempo estimado: {selectedNextStep.estimatedMinutes} minutos</span><span>Costo: $0 MXN</span></div>
                  <p className="step-reminder">Es una sugerencia práctica, no una decisión permanente ni una garantía de empleo. Puedes elegir otra posibilidad cuando quieras.</p>
                </section>
              )}
            </section>
          )}
          <div className="result-actions">
            <button className="primary-button" type="button" onClick={() => { setSelectedDirectionId(null); setScreen("activity"); }}>Cambiar mis respuestas</button>
            <button className="text-button" type="button" onClick={() => { setScreen("selection"); setResult(null); }}>Elegir otra actividad</button>
          </div>
          <p className="milestone-note">Tu elección se guarda sólo en este dispositivo y no contiene datos personales.</p>
        </div>
      )}
    </section>
  );
}
