import { personJsonLd } from '@lib/seo/person'

/**
 * Contenido SSR rastreable para la home (que por lo demás es un escritorio
 * interactivo client-side). Visualmente oculto (.sr-only) pero presente en el
 * HTML del servidor → Google y lectores de pantalla lo leen. Incluye el JSON-LD
 * Person para asociar perfiles sociales (sameAs) y el retrato.
 */
export function SeoHomeContent() {
  return (
    <>
      <header className="sr-only">
        <h1>Edvard Khachatryan Sahakyan — Científico de datos (Data Scientist)</h1>
        <p>
          Soy Edvard Khachatryan Sahakyan, Científico de datos en JNC Sistemas Informáticos SL e
          Ingeniero Informático en formación en la Universidad Alfonso X el Sabio (UAX), en Madrid
          (España). Trabajo en análisis de datos, modelado y soluciones de IA a medida, con base en
          MLOps/LLMOps y herramientas como Python, SQL y Docker. Este portfolio interactivo estilo
          Windows XP reúne mi CV, proyectos, certificaciones y quizzes.
        </p>
        <p lang="en">
          Edvard Khachatryan Sahakyan is a Data Scientist and Computer Engineering student (UAX) in
          Madrid, Spain, with a background in MLOps/LLMOps, Python, SQL and Docker.
        </p>
        <nav aria-label="Perfiles de Edvard Khachatryan Sahakyan">
          <a href="https://github.com/EdvardKS" rel="me noopener" target="_blank">
            GitHub: EdvardKS
          </a>
          <a href="https://www.linkedin.com/in/edvardks/" rel="me noopener" target="_blank">
            LinkedIn: edvardks
          </a>
          <a href="https://www.credly.com/users/edvardks" rel="me noopener" target="_blank">
            Credly: edvardks
          </a>
          <a href="https://edvardks.com/cv">CV de Edvard Khachatryan Sahakyan</a>
        </nav>
      </header>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
    </>
  )
}
