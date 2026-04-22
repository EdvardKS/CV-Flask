'use client'

export function AboutApp() {
  return (
    <div style={{ lineHeight: 1.6 }}>
      <h2 style={{ marginTop: 0 }}>Bienvenido al OS Portfolio 🪟</h2>
      <p>
        Esto es un portfolio interactivo que imita un sistema operativo estilo Windows XP,
        construido con <strong>Next.js 15 + TypeScript</strong>.
      </p>
      <h3>Cómo se usa</h3>
      <ul>
        <li><strong>Doble-click</strong> en un icono del escritorio para abrir su ventana.</li>
        <li>Arrastra la barra de título para mover la ventana.</li>
        <li>Arrastra al borde <strong>izquierdo / derecho</strong> → snap a mitad de pantalla. Al <strong>borde superior</strong> → maximizar.</li>
        <li>Redimensiona desde cualquiera de los <strong>8 bordes/esquinas</strong>.</li>
        <li><strong>Doble-click en la barra de título</strong> maximiza / restaura.</li>
        <li>Posición y tamaño se guardan en <code>localStorage</code>.</li>
      </ul>
      <h3>Apps disponibles</h3>
      <ul>
        <li><strong>Mi CV</strong> — resumen, experiencia, educación y habilidades.</li>
        <li><strong>Proyectos</strong> — grid con mis mini-proyectos.</li>
        <li><strong>Quiz</strong> — exámenes de ECSO, SSOO y otras asignaturas.</li>
        <li><strong>Padel Scout</strong> — dashboard de analítica de partidos.</li>
        <li><strong>Contacto</strong> — envíame un email.</li>
      </ul>
    </div>
  )
}
