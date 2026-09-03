# Decisiones de producto y arquitectura

## Milestone 1 — Base de reentrada privada

- **Entrada orientada al presente:** la primera acción significativa es `Dar mi primer paso`; avanza a una explicación breve del proceso y no solicita una causa de abandono. Esto materializa la Shadow Clause antes de introducir cualquier actividad.
- **Privacidad por diseño:** la apertura no contiene formularios, cuentas ni campos personales. El texto enumera los datos que no se solicitarán para reducir incertidumbre sin imitar un trámite institucional.
- **Simulación visible:** tanto la cabecera principal como el aviso del proceso identifican la experiencia como demo/simulada y aclaran que no es evaluación ni certificación.
- **Autoridad de la persona:** el adelanto del flujo explica que las posibilidades tendrán razones y límites, y que la persona elegirá qué explorar. No se presenta puntuación ni decisión automatizada.
- **Alcance técnico:** la pantalla es un Server Component estático. No se añadió estado, persistencia, autenticación, API ni actividad; esos límites corresponden a milestones posteriores.
- **Diseño móvil primero:** la composición parte de contenido lineal accesible y usa un breakpoint para ampliar a dos columnas. El CTA ocupa todo el ancho en pantallas pequeñas y se respeta `prefers-reduced-motion`.
- **Tipografía sin dependencia remota:** se usa la pila sans-serif del sistema para que el build sea reproducible sin descargar Google Fonts y para evitar peticiones tipográficas desde el navegador.
- **Pruebas de reglas críticas:** Vitest con React Testing Library verifica explícitamente lenguaje de no confesión, CTA hacia adelante, privacidad, simulación, ausencia de formularios y ausencia de la etiqueta prohibida.

## Milestone 2 — Microactividad estructurada

- **Una sola actividad funcional:** se muestran `Organizar`, `Resolver` y `Planear`, pero únicamente `Organizar` es un botón. Las otras familias se marcan como próximas y no simulan funcionalidad inexistente.
- **Límite cliente pequeño:** la entrada conserva su Server Component y delega sólo selección, formulario y resultado a un Client Component con estado efímero. No se usa `localStorage`, red ni persistencia remota.
- **Datos cerrados y explícitos:** `OrganizeAnswers` contiene exactamente tres respuestas tipadas con uniones de literales. El validador rechaza objetos incompletos, campos adicionales y valores fuera de sus allowlists.
- **Resultado determinista:** toda respuesta válida demuestra comparación de prioridades; confirmar datos añade `information-check`, y avisar más registrar añade `follow-through`. Las señales describen decisiones dentro de la simulación, no atributos permanentes de la persona.
- **Sin puntaje:** el resultado sólo contiene `activity`, `simulated`, `answers` y `demonstratedSignals`. La interfaz aclara que no es calificación ni conclusión personal.
- **Corrección reversible:** `Cambiar mis respuestas` conserva las opciones actuales para editarlas y recalcular. `Elegir otra actividad` vuelve a la selección sin guardar datos.
- **Validación compartible:** cálculo y validación viven en un módulo TypeScript puro, independiente de React. En este milestone no existe payload de servidor; el mismo límite queda preparado para reutilizarse en el Route Handler posterior.

## Milestone 3 — Posibilidades con LLM restringido

- **Frontera HTTP exacta:** `POST /api/directions` acepta únicamente `{ activityResult }`. El servidor vuelve a validar actividad, indicador de simulación, respuestas, señales y ausencia de campos adicionales; además recalcula las señales para impedir que el cliente altere la evidencia.
- **Evidencia autoritativa:** el resultado reconstruido por las reglas deterministas se envía sin campos adicionales al modelo y vuelve sin modificaciones en `evidence`. El modelo sólo propone explicaciones; no puede editar respuestas ni señales.
- **Catálogo cerrado:** el modelo puede elegir entre tres IDs y títulos predefinidos (`operations-support`, `inventory-control`, `customer-followup`). `confidenceLabel` también es enum. Razones y limitaciones tienen límites de longitud y filtros de lenguaje prohibido.
- **Structured Outputs:** la llamada REST usa Responses API con `text.format.type: json_schema`, schema estricto, `additionalProperties: false` en cada objeto y `store: false`. Se usa `gpt-5-mini` y `fetch` nativo, sin SDK.
- **Secreto sólo servidor:** `OPENAI_API_KEY` se lee exclusivamente en un módulo marcado `server-only`. `.env.example` contiene un placeholder vacío y `.gitignore` mantiene ignorados los demás archivos `.env`.
- **Fallo seguro:** ausencia de clave, timeout de ocho segundos, error HTTP/red, JSON malformado, contrato inválido o contenido inseguro producen tres posibilidades deterministas. La procedencia se etiqueta como respaldo y nunca se presenta como IA.
- **Validación en ambos extremos:** el cliente valida también la respuesta del Route Handler y comprueba que `evidence` sea exactamente el resultado enviado. Si el endpoint completo falla, usa el mismo respaldo determinista local.
- **Transparencia UX:** antes de solicitar posibilidades se conserva visible lo demostrado. Cada tarjeta muestra razón, confianza de demo o baja/media y limitación; un aviso destacado aclara que son posibilidades, no decisiones, y que tres minutos no determinan el futuro.
- **Corte de alcance:** no existe selección de dirección, generación de siguiente paso ni persistencia; esas capacidades pertenecen al Milestone 4.

## Milestone 4 — Elección y siguiente paso concreto

- **Elección explícita:** ninguna posibilidad llega seleccionada. Cada tarjeta conserva el mismo peso visual y presenta su propio botón `Elegir…`; la acción sólo aparece después de un clic de la persona.
- **IA no autoritativa:** no se modificó el Route Handler, prompt ni contrato del LLM. La IA continúa limitada a explicar posibilidades y no recibe la elección ni genera la acción.
- **Acciones deterministas:** cada `DirectionId` allowlisted tiene exactamente un `NextStep` local, gratuito, simulado, realizable hoy y de 15–20 minutos. Ninguno pide curso, postulación laboral, pago o información personal.
- **Una acción a la vez:** cambiar de posibilidad sustituye la acción visible; no acumula pasos ni oculta las demás alternativas. El recordatorio aclara que la elección es reversible y no define el futuro.
- **Persistencia mínima:** `localStorage` guarda exclusivamente JSON con `{ directionId }` bajo una clave versionada. Título, descripción, duración, evidencia, respuestas y texto del LLM se reconstruyen o permanecen en memoria y nunca se persisten.
- **Restauración validada:** el estado local debe ser un objeto exacto con un único ID del allowlist. JSON inválido, IDs desconocidos o campos adicionales provocan eliminación segura del valor.
- **Continuidad sin preselección:** una elección restaurada se muestra como recordatorio independiente en la entrada de actividades. No preselecciona automáticamente una posibilidad cuando se inicia un flujo nuevo.
- **Corte de alcance:** no se añadieron autenticación, persistencia remota, pagos, solicitudes de empleo, cursos, tutoría ni trabajo de hardening del Milestone 5.

## Milestone 5 — Auditoría de seguridad y UX

- **Resultado del audit:** el flujo completo conserva entrada privada, Shadow Clause, simulación honesta, datos cerrados, posibilidades inciertas, elección explícita y una acción gratuita. No se encontraron etiquetas prohibidas, framing gubernamental, puntajes, pagos, cursos, postulaciones ni tutoría.
- **Copy actualizado:** la explicación inferior ya no habla de una “siguiente etapa” inexistente; indica que la actividad ya puede elegirse. El recordatorio restaurado aclara también que la acción guardada sigue siendo una sugerencia reversible y no define el futuro.
- **Protección integral:** una nueva prueba recorre entrada, actividad, resultado, posibilidades y elección, y audita controles, CTAs y texto visible contra historia personal, identidades prohibidas, asistencia, pagos, puntajes y decisiones permanentes.
- **Autoridad del usuario verificada:** antes del clic no hay selección; después existe una sola selección, las tres alternativas siguen visibles y la interfaz recuerda que puede cambiarla.
- **Límite LLM verificado:** el modelo continúa recibiendo sólo `evidence`; Route Handler y módulo OpenAI no conocen la selección ni el catálogo de siguientes pasos. La clave continúa ausente del componente cliente.
- **Persistencia verificada:** sólo el ID allowlisted se conserva localmente; el audit no amplía el estado guardado ni introduce información personal.
- **Alcance cerrado:** no se añadieron funciones de producto. Tampoco se inició el ciclo mecánico ni el Persona Test, que requieren sesiones separadas.

## Mechanical Test Pass — fallos reproducidos y corregidos

### Bug 1 — almacenamiento bloqueado interrumpe la elección

- **Reproducción:** completar `Organizar`, cargar posibilidades, simular que `localStorage.setItem` lanza `SecurityError` y elegir `Apoyo en operaciones`.
- **Esperado:** mostrar el siguiente paso aunque el navegador no permita guardar continuidad local.
- **Resultado previo:** React recibía una excepción no controlada desde `chooseDirection`; Vitest la registró como `Uncaught Exception: SecurityError: Storage blocked`.
- **Impacto:** una restricción del navegador podía romper el resultado principal después de que la persona completara todo el flujo.
- **Causa raíz:** llamadas directas a `getItem`, `setItem` y `removeItem` asumían que Web Storage siempre estaba disponible.
- **Corrección:** se encapsularon lectura, escritura y borrado en funciones tolerantes a excepciones. La acción permanece visible y la UI informa honestamente cuando no pudo guardarse.

### Bug 2 — solicitud pendiente bloquea evidencia nueva y puede quedar obsoleta

- **Reproducción:** solicitar posibilidades, volver antes de recibir respuesta, cambiar una respuesta, recalcular e intentar solicitar posibilidades otra vez.
- **Esperado:** el resultado nuevo debe poder iniciar su propia solicitud; cualquier respuesta del resultado anterior debe ignorarse.
- **Resultado previo:** el botón permanecía deshabilitado como `Buscando posibilidades…`, porque `isLoadingDirections` seguía ligado a la solicitud anterior. El código tampoco tenía una identidad de solicitud que impidiera un overwrite tardío.
- **Impacto:** una red lenta podía impedir continuar después de corregir respuestas o mezclar posibilidades con evidencia anterior.
- **Causa raíz:** el estado de carga y las respuestas asíncronas no estaban versionados por resultado.
- **Corrección:** cada solicitud recibe un ID monotónico. Volver o recalcular invalida el ID y libera el estado de carga; `then`, `catch` y `finally` sólo actualizan UI si su ID sigue vigente. También se bloquean clics repetidos a nivel lógico.

### Bug 3 — elección local obsoleta sobrevive al cambio de respuestas

- **Reproducción:** elegir una posibilidad, confirmar que su ID está guardado y pulsar `Cambiar mis respuestas`.
- **Esperado:** invalidar la elección persistida porque la evidencia que la originó será revisada.
- **Resultado previo:** `localStorage` conservaba `{"directionId":"operations-support"}` y podía restaurarlo tras recargar.
- **Impacto:** la continuidad local podía presentar una acción desconectada del resultado vigente.
- **Causa raíz:** el retroceso limpiaba selección en memoria, pero no el estado persistido.
- **Corrección:** editar respuestas elimina de forma segura la selección guardada y reinicia su estado de continuidad.

### Profundización sin nuevos fallos

- Se verificaron clics repetidos, retroceso durante carga, orden inverso de respuestas, storage inválido/desconocido/con campos extra, JSON de API malformado, HTTP fallido, timeout, schema inválido, campos de puntaje y lenguaje de decisión.
- La validación determinista siguió rechazando respuestas, señales y formas manipuladas. El LLM permaneció fuera de la elección y del siguiente paso.
- No se ejecutó despliegue ni Persona Test en esta sesión.

## Persona Test — corrección focalizada

- **Persona representada:** Mariana, usuaria sintética que recorrió la experiencia implementada en español.
- **Confusión observada:** aunque entendió el aviso `No hay una calificación`, el CTA `Ver lo que demostré` le sonó a una evaluación personal. Al notar respuestas aparentemente mejores, dudó sobre qué esperaba el sistema y cuánto inferiría sobre ella a partir de tres decisiones simuladas.
- **Por qué fue la confusión prioritaria:** apareció antes de que la pantalla de resultado pudiera explicar los límites y afectó directamente la confianza para completar la primera actividad. Tocaba la honestidad de simulación y la distinción entre observar una acción y perfilar a una persona.
- **Cambio exacto:** el CTA ahora dice `Ver qué observó la actividad`. El texto cercano añade `Esto describe tus decisiones en esta simulación, no tus capacidades personales.` y conserva explícitamente que no hay calificación.
- **Lógica sin cambios:** no se modificaron respuestas, cálculo determinista, evidencia, Route Handler, LLM, posibilidades, elección, siguientes pasos ni persistencia. La corrección es exclusivamente de lenguaje y su cobertura de regresión.
