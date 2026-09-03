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
