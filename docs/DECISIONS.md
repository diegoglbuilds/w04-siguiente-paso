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
