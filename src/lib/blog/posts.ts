export type BlogLink = { label: string; href: string }

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'links'; title: string; items: BlogLink[] }

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  topic: string
  readingMinutes: number
  tags: string[]
  body: BlogBlock[]
}

const POSTS: BlogPost[] = [
  {
    slug: 'como-trabajo-con-agentes-de-ia',
    title: 'Cómo trabajo con agentes de IA: ellos escriben, yo decido',
    description:
      'Mi forma de trabajar con agentes que programan: especificación antes del código, pruebas de extremo a extremo, despliegue con puerta de salud y registro de cada hora.',
    date: '2026-10-13',
    topic: 'Forma de trabajo',
    readingMinutes: 6,
    tags: ['agentes de IA', 'ingeniería de software', 'forma de trabajo', 'MLOps'],
    body: [
      {
        type: 'p',
        text: 'Hace tiempo que casi todo el código que entrego lo escribe un agente de IA. Lo que no ha cambiado es quién responde de él. Esta es la forma de trabajar que me ha funcionado, después de muchos proyectos en producción y de algún susto.'
      },
      { type: 'h2', text: 'Primero la especificación, después el código' },
      {
        type: 'p',
        text: 'Antes de que el agente toque una línea, queda escrito qué se va a hacer, qué dudas hay, el plan y las tareas. Si no puedo explicarlo en un documento corto, no lo entiendo lo bastante como para delegarlo. El documento es lo que reviso yo; el código es la consecuencia.'
      },
      { type: 'h2', text: 'Objetos con comportamiento y componentes autocontenidos' },
      {
        type: 'p',
        text: 'Pido siempre lo mismo: entidades que saben hacer cosas, componentes que se entienden sin abrir otros tres ficheros y nombres que digan lo que hay. Un agente escribe muy rápido, así que el desorden también llega muy rápido. La arquitectura es mi trabajo, no el suyo.'
      },
      { type: 'h2', text: 'Nada sale sin prueba de extremo a extremo' },
      {
        type: 'p',
        text: 'Que compile no significa nada. Cada cambio se comprueba como lo haría una persona: navegador real, móvil y escritorio, el flujo completo de principio a fin. Las pruebas automáticas quedan en el repositorio y se ejecutan antes de cada despliegue.'
      },
      { type: 'h2', text: 'Despliegue con puerta y vuelta atrás' },
      {
        type: 'ul',
        items: [
          'Copia de seguridad antes de tocar producción.',
          'Comprobación de salud después de desplegar; si falla, vuelve sola a la versión anterior.',
          'Un despliegue nunca borra datos ni volúmenes.',
          'Lo irreversible no se hace sin confirmación explícita.'
        ]
      },
      { type: 'h2', text: 'Cada hora queda registrada' },
      {
        type: 'p',
        text: 'Llevo un registro de horas por proyecto con lo que se hizo en cada tramo y los commits que lo respaldan. De ahí sale la gráfica de actividad del escritorio de esta web. No es para presumir: es para poder decirle a un cliente qué se hizo un martes de hace dos meses.'
      },
      { type: 'h2', text: 'Lo que el agente no decide' },
      {
        type: 'ul',
        items: [
          'Qué problema merece resolverse.',
          'Qué datos pueden salir de la empresa y cuáles no.',
          'Qué permisos tiene cada persona.',
          'Cuándo algo está terminado.'
        ]
      },
      {
        type: 'links',
        title: 'Sigue leyendo',
        items: [
          { label: 'Casos en producción hechos así', href: 'https://iaeks.com/casos' },
          { label: 'El bot de Telegram con el que opero mis servidores', href: 'https://iaeks.com/casos/bot-telegram' },
          { label: 'Proyectos de IA generativa y agentes', href: '/projects/agentic-rag-langgraph' }
        ]
      }
    ]
  },
  {
    slug: 'accuracy-no-es-una-metrica',
    title: 'Accuracy no es una métrica: cómo leo un modelo de clasificación',
    description:
      'Con datos desbalanceados, la accuracy engaña. Así comparo modelos de machine learning: mismo preprocesado, modelo base, classification_report y matriz de confusión.',
    date: '2026-10-11',
    topic: 'Machine learning',
    readingMinutes: 6,
    tags: ['machine learning', 'scikit-learn', 'métricas', 'datos desbalanceados', 'ciencia de datos'],
    body: [
      {
        type: 'p',
        text: 'Un modelo que acierta el 85 % de las veces puede ser inútil. Si el 85 % de los casos son de una misma clase, basta con decir siempre esa clase para llegar a ese número sin haber aprendido nada.'
      },
      { type: 'h2', text: 'El ejemplo: cancelaciones de hotel' },
      {
        type: 'p',
        text: 'En mi serie sobre el dataset Hotel Bookings el objetivo es predecir si una reserva se cancela. La variable objetivo está desbalanceada, así que lo primero fue tratar ese desbalanceo y montar una regresión logística como modelo base contra el que medir todo lo demás.'
      },
      { type: 'h2', text: 'Mismo preprocesado, distinto modelo' },
      {
        type: 'p',
        text: 'Comparar modelos solo tiene sentido si lo único que cambia es el modelo. Por eso todo va en un pipeline de scikit-learn: escalado, selección o reducción de variables y clasificador. Sobre el mismo problema probé un árbol de decisión con SelectKBest y un Random Forest con PCA.'
      },
      { type: 'h2', text: 'Lo que miro antes que la accuracy' },
      {
        type: 'ul',
        items: [
          'La matriz de confusión: en qué se equivoca y hacia qué lado.',
          'Precisión y exhaustividad de la clase que importa, no la media.',
          'El coste de cada error: no es lo mismo predecir una cancelación que no ocurre que no ver una que sí.',
          'Si el modelo mejora al modelo base lo suficiente como para justificar su complejidad.'
        ]
      },
      { type: 'h2', text: 'Por qué insisto en el pipeline' },
      {
        type: 'p',
        text: 'Un pipeline evita el error más común: que información del conjunto de prueba se cuele en el entrenamiento a través del escalado o de la selección de variables. Además deja el modelo listo para desplegar tal cual, sin reescribir el preprocesado en otro sitio.'
      },
      { type: 'h2', text: 'La pregunta que cierra el estudio' },
      {
        type: 'p',
        text: 'No es qué modelo tiene el número más alto. Es qué decisión cambia en el negocio con este modelo y cuánto cuesta cuando falla. Si no hay respuesta, el modelo todavía no sirve.'
      },
      {
        type: 'links',
        title: 'Los proyectos de la serie',
        items: [
          { label: 'Booking · Regresión logística', href: '/projects/booking-logistic' },
          { label: 'Booking · Árbol de decisión', href: '/projects/booking-decisiontree' },
          { label: 'Booking · Random Forest + PCA', href: '/projects/booking-randomforest' }
        ]
      }
    ]
  },
  {
    slug: 'deep-learning-de-principio-a-fin',
    title: 'Deep learning de principio a fin: lo que aprendí entrenando mis propias redes',
    description:
      'Redes convolucionales para caras y emociones, ResNet con transferencia de aprendizaje, aprendizaje por refuerzo y redes de grafos sobre bases de datos. Lo que me enseñó cada proyecto.',
    date: '2026-10-09',
    topic: 'Deep learning',
    readingMinutes: 7,
    tags: ['deep learning', 'redes convolucionales', 'PyTorch', 'TensorFlow', 'aprendizaje por refuerzo', 'GNN'],
    body: [
      {
        type: 'p',
        text: 'Usar un modelo ya entrenado es fácil. Entender por qué funciona exige entrenar alguno desde cero y verlo fallar. Estos son los proyectos con los que aprendí deep learning y lo que saqué de cada uno.'
      },
      { type: 'h2', text: 'Dos redes encadenadas: puntos faciales y emociones' },
      {
        type: 'p',
        text: 'Una primera red convolucional localiza los puntos clave de la cara por regresión y una segunda clasifica la emoción en cinco categorías. Aprendí que encadenar modelos multiplica los errores: lo que falla la primera lo hereda la segunda. El aumento de datos y la parada temprana hicieron más por el resultado que añadir capas.'
      },
      { type: 'h2', text: 'ResNet y transferencia de aprendizaje' },
      {
        type: 'p',
        text: 'Sobre CIFAR-10 con arquitectura ResNet, y después con un clasificador de flores en PyTorch dentro del nanodegree de AWS y Udacity. La lección fue práctica: casi nunca conviene empezar de cero. Reutilizar una red ya entrenada y ajustar las últimas capas da mejor resultado con una fracción de los datos y del tiempo.'
      },
      { type: 'h2', text: 'Aprendizaje por refuerzo: MountainCar' },
      {
        type: 'p',
        text: 'Un coche que no tiene fuerza para subir la cuesta y debe aprender a coger impulso. Con una tabla Q discretizada se ve muy bien el problema central del refuerzo: la recompensa llega tarde, y el agente tiene que descubrir que alejarse del objetivo es parte del camino.'
      },
      { type: 'h2', text: 'Redes de grafos sobre bases de datos relacionales' },
      {
        type: 'p',
        text: 'Con RelBench y PyTorch Geometric entrené redes neuronales de grafos directamente sobre tablas relacionadas, sin aplanarlas a mano en una sola tabla. Para quien trabaja con datos de empresa es una idea potente: la estructura de la base de datos ya contiene información que el aplanado destruye.'
      },
      { type: 'h2', text: 'Lo que me llevo' },
      {
        type: 'ul',
        items: [
          'Los datos y su aumento pesan más que la arquitectura.',
          'Empezar por un modelo ya entrenado casi siempre es la decisión correcta.',
          'Guardar los pesos y el punto de control es parte del trabajo, no un extra.',
          'Un modelo solo se entiende de verdad cuando has visto cómo falla.'
        ]
      },
      {
        type: 'links',
        title: 'Los proyectos',
        items: [
          { label: 'Puntos faciales y emociones', href: '/projects/dl-facial' },
          { label: 'ResNet sobre CIFAR-10', href: '/projects/dl-cifar10' },
          { label: 'Clasificador de flores en PyTorch', href: '/projects/pytorch-flowers' },
          { label: 'Q-Learning · MountainCar', href: '/projects/rl-mountaincar' },
          { label: 'RelBench · deep learning relacional', href: '/projects/relbench' }
        ]
      }
    ]
  },
  {
    slug: 'rag-y-modelos-en-local',
    title: 'RAG y modelos en local: cuándo merece la pena no depender de una API',
    description:
      'Qué he aprendido montando RAG con Qdrant, pgvector y LangGraph y sirviendo modelos de lenguaje en mi propio servidor. Cuándo compensa el modelo local y cuándo no.',
    date: '2026-10-07',
    topic: 'IA generativa',
    readingMinutes: 6,
    tags: ['RAG', 'LLM local', 'LangGraph', 'Qdrant', 'pgvector', 'privacidad'],
    body: [
      {
        type: 'p',
        text: 'Casi todos los proyectos de IA generativa empiezan llamando a una API. Algunos no pueden: los datos son de clientes, de pacientes o de contabilidad, y no deben salir de la empresa. Para esos casos llevo tiempo montando la alternativa.'
      },
      { type: 'h2', text: 'RAG: que el modelo conteste con tus documentos' },
      {
        type: 'p',
        text: 'La idea es sencilla: buscar los fragmentos relevantes y dárselos al modelo junto con la pregunta. La dificultad está en la ingesta. Un PDF troceado sin respetar sus secciones produce respuestas que suenan bien y están mal. Por eso mis canales de ingesta son conscientes de la estructura del documento.'
      },
      { type: 'h2', text: 'No pagar dos veces el mismo trabajo' },
      {
        type: 'p',
        text: 'Reindexar una colección entera cada vez que cambia un fichero es caro y lento. Detectar duplicados por su huella y guardar un manifiesto de lo ya ingerido convierte la reindexación en algo que se puede lanzar a diario.'
      },
      { type: 'h2', text: 'Agentes, con medida' },
      {
        type: 'p',
        text: 'He usado LangGraph para orquestar y CrewAI para repartir papeles entre agentes. Sirven cuando la tarea tiene pasos que dependen del resultado anterior. Para lo demás, un flujo fijo es más barato, más rápido y más fácil de depurar.'
      },
      { type: 'h2', text: 'Servir el modelo en casa' },
      {
        type: 'p',
        text: 'En mi servidor corre una pasarela propia delante del motor de inferencia, con llamada a herramientas, caché de prompts, selección de modelo y métricas. Y he probado hasta dónde llega un modelo pequeño cuantizado sin GPU grande: más lejos de lo que parece para clasificar, extraer y resumir.'
      },
      { type: 'h2', text: 'Cuándo compensa lo local' },
      {
        type: 'ul',
        items: [
          'Cuando los datos no pueden salir de la empresa.',
          'Cuando el volumen es alto y la tarea es repetitiva y acotada.',
          'Cuando necesitas que el coste sea fijo y previsible.'
        ]
      },
      { type: 'h2', text: 'Cuándo no' },
      {
        type: 'ul',
        items: [
          'Cuando la tarea exige razonamiento largo o mucho contexto.',
          'Cuando nadie va a mantener el servidor.',
          'Cuando el uso es tan bajo que la API sale más barata que la electricidad.'
        ]
      },
      {
        type: 'links',
        title: 'Los proyectos',
        items: [
          { label: 'agentic-rag-langgraph', href: '/projects/agentic-rag-langgraph' },
          { label: 'LavBotDocker · pila RAG con Qdrant', href: '/projects/lavbotdocker' },
          { label: 'ai-hub · pasarela de modelos', href: '/projects/ai-hub' },
          { label: 'coconut · modelo local cuantizado', href: '/projects/coconut' },
          { label: 'IA local en este servidor', href: '/projects/ia' }
        ]
      }
    ]
  },
  {
    slug: 'lo-que-pienso-de-la-ia-otono-2026',
    title: 'Lo que pienso de la IA este otoño: España, Europa y Silicon Valley',
    description:
      'Mi lectura personal de seis noticias de inteligencia artificial: pymes que no la usan, gigafactorías, el reglamento europeo aplazado, laboratorios que salen a bolsa y modelos capaces de atacar.',
    date: '2026-10-13',
    topic: 'Actualidad',
    readingMinutes: 5,
    tags: ['actualidad IA', 'opinión', 'España', 'Europa', 'Silicon Valley'],
    body: [
      {
        type: 'p',
        text: 'Sigo la actualidad de la IA con una sola pregunta: qué cambia esto en lo que hago mañana. Casi nada pasa ese filtro. Estas seis noticias sí, y he escrito sobre cada una con detalle en el blog de mi consultora. Aquí va la versión corta y más personal.'
      },
      { type: 'h2', text: 'España: el problema no es saber, es hacer' },
      {
        type: 'p',
        text: 'Solo una de cada veinticinco pymes industriales usa IA de verdad, y a la vez el país aspira a una gigafactoría con cien mil chips. Las dos cosas son ciertas y no se contradicen, pero me quedo con la primera. Me dedico a esto y lo veo cada semana: lo que falta no es cómputo, es alguien que deje un proceso funcionando.'
      },
      { type: 'h2', text: 'Europa: construir bien sale más barato que cumplir tarde' },
      {
        type: 'p',
        text: 'El reglamento de IA aplaza el alto riesgo y Europa pone dinero para siete gigafactorías con chips comprados fuera. Mi postura es poco épica: permisos, registro y control de datos desde el primer día. Así da igual cuándo llegue la obligación.'
      },
      { type: 'h2', text: 'Silicon Valley: no casarse con nadie' },
      {
        type: 'p',
        text: 'Los laboratorios salen a bolsa y uno de ellos ha lanzado un modelo que él mismo considera de riesgo crítico en ciberseguridad. De lo primero saco una regla: diseñar para poder cambiar de modelo. De lo segundo, otra: atacar se ha abaratado para todos, así que la seguridad básica ya no es opcional para nadie.'
      },
      { type: 'h2', text: 'Mi resumen' },
      {
        type: 'ul',
        items: [
          'Empezar por un proceso pequeño y real, no por una estrategia.',
          'Tratar los datos como si la ley ya obligase.',
          'No depender de un único proveedor.',
          'Dedicar una tarde a la seguridad antes de dedicar un mes a la IA.'
        ]
      },
      {
        type: 'links',
        title: 'Las seis noticias, con fuentes',
        items: [
          { label: 'Solo el 4,1 % de las pymes industriales usa IA de verdad', href: 'https://iaeks.com/blog/pymes-espana-uso-real-ia-2026' },
          { label: 'Plan IA360 y la gigafactoría española', href: 'https://iaeks.com/blog/plan-ia360-gigafactoria-ia-espana' },
          { label: 'Reglamento europeo de IA: el alto riesgo se aplaza', href: 'https://iaeks.com/blog/reglamento-ia-europa-alto-riesgo-aplazado' },
          { label: 'Europa busca sede para siete gigafactorías de IA', href: 'https://iaeks.com/blog/europa-siete-gigafactorias-ia' },
          { label: 'Anthropic prepara su salida a bolsa', href: 'https://iaeks.com/blog/anthropic-salida-a-bolsa-que-cambia' },
          { label: 'GPT-6 Astra y el riesgo crítico de ciberseguridad', href: 'https://iaeks.com/blog/gpt-6-astra-ciberseguridad-riesgo-critico' }
        ]
      }
    ]
  }
]

export const BLOG_POSTS: BlogPost[] = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(post => post.slug === slug)
}

export function blogPath(slug: string): string {
  return `/blog/${slug}`
}
