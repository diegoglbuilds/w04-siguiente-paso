const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
    <path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const LockIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
    <path d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

const DoorIllustration = () => (
  <svg aria-hidden="true" className="door-illustration" viewBox="0 0 430 300">
    <defs>
      <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#efe8ff" /><stop offset="1" stopColor="#fff9cf" /></linearGradient>
      <linearGradient id="path" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#7b51bc" /><stop offset="1" stopColor="#f3edff" /></linearGradient>
    </defs>
    <circle cx="332" cy="78" r="34" fill="#fff6a6" opacity=".9" />
    <path d="M0 190 90 118l60 54 66-77 90 90 54-53 70 59v109H0Z" fill="#e3d8f5" />
    <path d="M0 218 77 162l68 52 66-45 79 48 74-48 66 53v78H0Z" fill="#d3c2ed" />
    <path d="M151 37h150v203H151z" fill="#7c57ad" opacity=".2" />
    <path d="M164 47h126v179H164z" fill="url(#sky)" stroke="#9e7bc8" strokeWidth="3" />
    <path d="m164 47 82 18v177l-82-16Z" fill="#f7f2ff" stroke="#8f68bd" strokeWidth="3" />
    <circle cx="232" cy="145" r="4" fill="#7043a9" />
    <path d="M246 242c-64 10-108 29-140 58h215c-18-25-43-44-75-58Z" fill="url(#path)" />
  </svg>
);

export default function Home() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <nav className="topbar" aria-label="Principal">
          <a className="brand" href="#inicio" aria-label="Siguiente Paso, inicio"><span className="brand-mark" aria-hidden="true">↗</span><span>Siguiente Paso</span></a>
          <span className="privacy-chip"><LockIcon /> Privado</span>
        </nav>
        <div className="hero-grid" id="inicio">
          <div className="hero-copy">
            <span className="demo-badge">Demo · experiencia simulada</span>
            <p className="eyebrow">Tu primer paso es hacia adelante</p>
            <h1 id="hero-title">Empieza por lo que puedes hacer hoy.</h1>
            <p className="hero-lead">No necesitas explicar por qué dejaste la escuela o un trabajo. Aquí comienzas con una acción breve, no con preguntas sobre tu pasado.</p>
            <a className="primary-button" href="#como-funciona">Dar mi primer paso <ArrowIcon /></a>
            <p className="privacy-note"><LockIcon /> No te pediremos nombre, teléfono, documentos ni datos personales.</p>
          </div>
          <div className="illustration-card">
            <DoorIllustration />
            <div className="illustration-caption"><span aria-hidden="true">01</span><p><strong>Entrada privada</strong> Empieza haciendo, sin justificar tu historia.</p></div>
          </div>
        </div>
      </section>
      <section className="how-it-works" id="como-funciona" aria-labelledby="how-title">
        <div className="section-heading">
          <p className="eyebrow">Así funciona</p>
          <h2 id="how-title">Una acción corta abre posibilidades.</h2>
          <p>En la siguiente etapa podrás elegir una actividad simulada de menos de cinco minutos.</p>
        </div>
        <ol className="steps">
          <li><span>1</span><div><strong>Haz algo breve</strong><p>Una actividad práctica con respuestas cerradas.</p></div></li>
          <li><span>2</span><div><strong>Mira posibilidades</strong><p>Verás razones claras y límites, nunca una decisión sobre tu futuro.</p></div></li>
          <li><span>3</span><div><strong>Elige tú</strong><p>Tú decides qué explorar y cuál puede ser tu siguiente paso.</p></div></li>
        </ol>
        <aside className="demo-callout" aria-label="Aviso de demostración"><span aria-hidden="true">i</span><p><strong>Esto es una demostración.</strong> Las actividades y resultados serán simulados; no son una evaluación ni una certificación real.</p></aside>
      </section>
      <footer>
        <a className="brand footer-brand" href="#inicio"><span className="brand-mark" aria-hidden="true">↗</span> Siguiente Paso</a>
        <p>Sin cuenta · Sin datos personales · Tú eliges</p>
      </footer>
    </main>
  );
}
