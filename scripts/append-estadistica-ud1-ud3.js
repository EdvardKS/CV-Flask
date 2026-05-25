/* eslint-disable */
const fs = require('fs')
const path = require('path')

const target = path.join(__dirname, '..', 'public', 'data', 'quiz', 'estadistica.json')
const cur = JSON.parse(fs.readFileSync(target, 'utf8'))

const UD1 = 'UD1 · Estadística descriptiva'
const UD3 = 'UD3 · Variables aleatorias'

function mk(cat, q, opts, ci, hint, ec, ew) {
  return {
    cuatrimestre: 1,
    category: cat,
    q,
    options: opts,
    correctIndex: ci,
    hint,
    explanationCorrect: ec,
    explanationWrong: ew
  }
}

const ud1 = [
  mk(UD1,
    'La frecuencia relativa acumulada de un valor es:',
    [
      'El porcentaje de datos menores o iguales que el valor considerado.',
      'El número de veces que el valor se repite.',
      'El cociente entre el número de veces que el valor se repite y el número total de datos.',
      'El número de datos menores o iguales que el valor considerado.'
    ],
    0,
    'Relativa = proporción/porcentaje. Acumulada = "≤ valor".',
    'Frecuencia relativa acumulada = porcentaje (o proporción) de datos ≤ al valor considerado.',
    'Incorrecto. Es el porcentaje/proporción de datos ≤ al valor. La absoluta acumulada sería el número, la relativa simple sería el cociente ni/N.'
  ),
  mk(UD1,
    'La frecuencia relativa de un valor es:',
    [
      'El número de datos menores o iguales que el valor considerado.',
      'El número de veces que el valor se repite.',
      'El cociente entre el número de veces que el valor se repite y el número total de datos.',
      'El porcentaje de datos menores o iguales que el valor considerado.'
    ],
    2,
    'fr = ni / N.',
    'Frecuencia relativa = cociente entre la absoluta del valor y el total de datos (ni/N).',
    'Incorrecto. fr = ni/N. La absoluta es solo ni; las acumuladas implican "≤".'
  ),
  mk(UD1,
    'La marca de clase de un intervalo es:',
    [
      'El punto medio del intervalo.',
      'El límite inferior del intervalo.',
      'La diferencia entre el límite superior y el límite inferior del intervalo.',
      'El límite superior del intervalo.'
    ],
    0,
    '(Li + Ls) / 2.',
    'Marca de clase = punto medio del intervalo = (Li+Ls)/2. Representa al intervalo en los cálculos.',
    'Incorrecto. Es el punto medio (Li+Ls)/2. La diferencia Ls-Li es la amplitud.'
  ),
  mk(UD1,
    'La frecuencia absoluta de un valor es:',
    [
      'El número total de datos menores o iguales que el valor considerado.',
      'El cociente entre el número de veces que el valor se repite y el número total de datos.',
      'El número de veces que el valor se repite.',
      'El porcentaje de datos menores o iguales que el valor considerado.'
    ],
    2,
    'Cuenta directa (ni).',
    'Frecuencia absoluta ni = número de veces que aparece el valor.',
    'Incorrecto. Es el conteo (ni). El cociente ni/N es la relativa; "menores o iguales" es acumulada.'
  ),
  mk(UD1,
    'La moda es:',
    [
      'La frecuencia absoluta del valor que más se repite.',
      'El valor que deja a su derecha y a su izquierda el mismo número de observaciones, supuesto que los datos están ordenados de menor a mayor.',
      'Ninguna respuesta es correcta.',
      'El valor que más se repite.'
    ],
    3,
    'Mo = el más frecuente.',
    'Moda = el valor (no la frecuencia) que más se repite. Puede haber varias modas.',
    'Incorrecto. La moda es el VALOR más repetido, no su frecuencia. El que parte a la mitad es la mediana.'
  ),
  mk(UD1,
    'La frecuencia absoluta acumulada de un valor es:',
    [
      'El número de datos menores o iguales que el valor considerado.',
      'El número de veces que el valor se repite.',
      'El porcentaje de datos menores o iguales que el valor considerado.',
      'El cociente entre el número de veces que el valor se repite y el número total de datos.'
    ],
    0,
    'Suma de ni hasta ese valor.',
    'Ni = nº de datos ≤ al valor. Es la suma de las absolutas hasta ahí.',
    'Incorrecto. Es el conteo acumulado (≤). El porcentaje sería la relativa acumulada.'
  ),
  mk(UD1,
    'La mediana es:',
    [
      'Ninguna respuesta es correcta.',
      'El valor que deja a su derecha y a su izquierda el mismo número de observaciones, supuesto que los datos están ordenados de mayor a menor.',
      'El valor que más se repite.',
      'El valor que deja a su derecha y a su izquierda el mismo número de observaciones, supuesto que los datos están ordenados de menor a mayor.'
    ],
    3,
    'Posición central con datos ordenados ascendentemente.',
    'Mediana = valor central con datos ordenados de MENOR a mayor. Deja igual nº de observaciones a cada lado.',
    'Incorrecto. Datos ordenados de menor a mayor (no al revés). El más repetido es la moda.'
  ),
  mk(UD1,
    'La varianza...:',
    [
      'Tomará valores negativos sólo si la variable estadística toma valores negativos.',
      'Puede ser positiva o nula.',
      'Puede ser positiva, negativa o nula.',
      'Nunca puede ser nula.'
    ],
    1,
    'Es media de cuadrados.',
    's² ≥ 0 siempre (media de desviaciones al cuadrado). Es 0 si todos los datos son iguales.',
    'Incorrecto. Nunca es negativa (suma de cuadrados). Es 0 cuando no hay dispersión.'
  ),
  mk(UD1,
    'Si la desviación típica es igual a 9:',
    [
      'La varianza es igual a 3.',
      'Ninguna respuesta es correcta.',
      'No es posible calcular la varianza.',
      'La varianza es igual a 81.'
    ],
    3,
    'σ = √(varianza). 9² = ?',
    'σ = √(varianza) → varianza = σ² = 9² = 81.',
    'Incorrecto. Varianza = σ² = 81. La raíz daría 3 pero la relación es al cuadrado.'
  ),
  mk(UD1,
    'Si la media de una variable es igual a 2 y la desviación típica es igual a 4, el coeficiente de variación de Pearson es:',
    ['4.', '0,5.', 'Ninguna respuesta es correcta.', '2.'],
    3,
    'CV = σ / |media|.',
    'CV de Pearson = σ/|x̄| = 4/2 = 2.',
    'Incorrecto. CV = σ/media = 4/2 = 2. 0,5 sería media/σ.'
  )
]

const ud3 = [
  mk(UD3,
    'La esperanza y la varianza de una variable aleatoria discreta se calculan a partir de:',
    [
      'La distribución de probabilidad.',
      'La función de distribución.',
      'La función de distribución y la distribución de probabilidad.',
      'Ninguna respuesta es correcta.'
    ],
    0,
    'E[X] = Σ x·P(X=x). Necesitas P puntual.',
    'En VA discreta E[X] y Var[X] se calculan con la distribución de probabilidad (función de masa P(X=x)).',
    'Incorrecto. Solo con la distribución de probabilidad. La función de distribución da acumulada, no entra directamente en las sumas.'
  ),
  mk(UD3,
    'La distribución de probabilidad o función de masa de una variable discreta nos proporciona:',
    [
      'La probabilidad puntual.',
      'La probabilidad acumulada.',
      'La probabilidad puntual y la probabilidad acumulada.',
      'Ninguna respuesta es correcta.'
    ],
    0,
    'Masa = P(X=x).',
    'Función de masa = probabilidad PUNTUAL P(X=x). La acumulada la da F(x).',
    'Incorrecto. Solo la puntual. La acumulada P(X≤x) viene de la función de distribución F.'
  ),
  mk(UD3,
    'Las probabilidades asociadas a cada valor de una variable aleatoria discreta:',
    [
      'Pueden tomar cualquier valor.',
      'Tomarán valores negativos si la variable aleatoria puede tomar valores negativos.',
      'Están entre 0 y 1.',
      'Ninguna respuesta es correcta.'
    ],
    2,
    'Axioma de probabilidad.',
    '0 ≤ P(X=xi) ≤ 1 siempre, sea cual sea el signo de X. Y Σ pi = 1.',
    'Incorrecto. Una probabilidad SIEMPRE está en [0,1], independientemente del signo de los valores de X.'
  ),
  mk(UD3,
    'La función de distribución de una variable aleatoria continua particularizada en un punto nos indica:',
    [
      'La probabilidad puntual.',
      'La probabilidad acumulada.',
      'La probabilidad puntual y la probabilidad acumulada.',
      'Ninguna respuesta es correcta.'
    ],
    1,
    'F(x) = P(X≤x).',
    'F(x) en VA continua = P(X≤x) = probabilidad acumulada.',
    'Incorrecto. F(x) = P(X≤x). En continua la puntual P(X=x) vale 0; no la da F.'
  ),
  mk(UD3,
    'La esperanza y la varianza de una variable aleatoria continua se calculan a partir de:',
    [
      'La función de densidad.',
      'La función de distribución.',
      'La función de distribución y la función de densidad.',
      'Ninguna respuesta es correcta.'
    ],
    0,
    'E[X] = ∫ x·f(x) dx.',
    'En VA continua E[X] y Var[X] se calculan con la función de densidad f(x) (integrando).',
    'Incorrecto. Solo con la densidad f(x). F(x) acumulada no entra directamente en la integral de E[X].'
  ),
  mk(UD3,
    'Se lanza un dado una vez y se considera la variable aleatoria "Puntuación obtenida". La variable es:',
    [
      'Discreta.',
      'Continua.',
      'Con esta información no es posible determinar si la variable es discreta o continua.',
      'Ninguna respuesta es correcta.'
    ],
    0,
    'Valores {1,2,3,4,5,6}: aislados.',
    'Toma valores aislados {1..6}: VA discreta.',
    'Incorrecto. Discreta: el dado da valores aislados, no un continuo.'
  ),
  mk(UD3,
    'La diferencia entre la varianza y la desviación típica de una variable aleatoria es:',
    [
      'La varianza es una medida de dispersión y la desviación típica no.',
      'La desviación típica es una medida de dispersión y la varianza no.',
      'La varianza está expresada en las unidades al cuadrado y la desviación típica en las mismas unidades que la variable.',
      'Ninguna respuesta es correcta.'
    ],
    2,
    'σ = √Var. Unidades.',
    'Var[X] está en unidades², σ = √Var[X] en las mismas unidades que X. Ambas miden dispersión.',
    'Incorrecto. Ambas son medidas de dispersión; la diferencia está en las unidades (Var en cuadrado, σ misma unidad).'
  ),
  mk(UD3,
    'La función de distribución de una variable aleatoria discreta particularizada en un punto nos indica:',
    [
      'La probabilidad puntual.',
      'La probabilidad acumulada.',
      'La probabilidad puntual y la probabilidad acumulada.',
      'Ninguna respuesta es correcta.'
    ],
    1,
    'F(x) = P(X≤x) siempre.',
    'F(x) = P(X≤x): acumulada, también en VA discreta.',
    'Incorrecto. F(x) acumulada. La puntual la da la función de masa P(X=x).'
  ),
  mk(UD3,
    'Una caja contiene 10 piezas fabricadas de forma independiente, con probabilidad de defecto 0,2. La variable "número de piezas defectuosas en una caja" sigue una distribución:',
    ['Binomial.', 'Poisson.', 'Normal.', 'Ninguna respuesta es correcta.'],
    0,
    'n fijo, p fijo, ensayos independientes.',
    'n=10 ensayos independientes con p=0,2 fija → Binomial B(10; 0,2).',
    'Incorrecto. Binomial: n fijo + p fija + independencia. Poisson sería para nº de sucesos en intervalo con λ.'
  ),
  mk(UD3,
    'Para calcular probabilidades en variable aleatoria discreta, podemos utilizar:',
    [
      'Únicamente la distribución de probabilidad.',
      'Únicamente la función de distribución.',
      'La función de distribución y la distribución de probabilidad.',
      'Ninguna de las respuestas es correcta.'
    ],
    2,
    'Puntuales con masa, acumuladas con F.',
    'En VA discreta sirven ambas: la función de masa para puntuales y la de distribución para acumuladas.',
    'Incorrecto. Ambas son válidas según lo que quieras calcular (puntual o acumulada).'
  ),
  mk(UD3,
    'El área debajo de la función de densidad es igual a:',
    ['1.', '0.', 'Puede tomar cualquier valor.', 'Ninguna respuesta es correcta.'],
    0,
    '∫ f(x) dx en todo R.',
    '∫_{-∞}^{∞} f(x) dx = 1 (axioma de probabilidad total).',
    'Incorrecto. Siempre 1: representa probabilidad total.'
  ),
  mk(UD3,
    'La suma de todas las probabilidades puntuales asociadas a los valores que puede tomar una variable aleatoria discreta:',
    ['Es igual a 0.', 'Es igual a 1.', 'Puede tomar cualquier valor.', 'Ninguna respuesta es correcta.'],
    1,
    'Σ pi = 1.',
    'Σ P(X=xi) = 1 sobre todos los valores posibles.',
    'Incorrecto. Suma = 1 (probabilidad total).'
  ),
  mk(UD3,
    'La varianza de una variable aleatoria:',
    [
      'Mide la dispersión, es decir, la proximidad o alejamiento de los valores de la variable con respecto a la esperanza.',
      'Puede tomar valores negativos.',
      'Está expresada en las mismas unidades que la variable.',
      'Ninguna respuesta es correcta.'
    ],
    0,
    'Var[X] = E[(X-μ)²].',
    'Var[X] mide dispersión respecto a la media μ = E[X]. Es E[(X-μ)²].',
    'Incorrecto. Mide dispersión respecto a μ. Nunca es negativa y está en unidades al cuadrado.'
  ),
  mk(UD3,
    'Una variable aleatoria continua es aquella que:',
    [
      'Toma valores aislados.',
      'Puede tomar cualquier valor en un intervalo.',
      'Siempre toma el mismo valor.',
      'Ninguna respuesta es correcta.'
    ],
    1,
    'Continuo = intervalo real.',
    'VA continua toma valores en un intervalo (no enumerables).',
    'Incorrecto. Aislados → discreta. Continua = cualquier valor en un intervalo.'
  ),
  mk(UD3,
    '¿Cuál es la probabilidad de que una distribución N(20,8) tome un valor mayor a 26?',
    ['0,2266', '0,7734', '0,242', 'Ninguna respuesta es correcta'],
    0,
    'Tipifica: z=(26-20)/8=0,75. P(Z>0,75).',
    'z=(26-20)/8=0,75. P(Z>0,75)=1-Φ(0,75)=1-0,7734=0,2266.',
    'Incorrecto. P(X>26)=P(Z>0,75)=0,2266. 0,7734 sería P(X≤26).'
  ),
  mk(UD3,
    'Una variable aleatoria discreta es aquella que:',
    [
      'Toma valores aislados.',
      'Puede tomar cualquier valor en un intervalo.',
      'Siempre toma el mismo valor.',
      'Ninguna respuesta es correcta.'
    ],
    0,
    'Discreta = puntos separados.',
    'VA discreta toma valores aislados (numerables).',
    'Incorrecto. Aislados (discreta). Intervalo entero = continua.'
  ),
  mk(UD3,
    'Si se quiere calcular la probabilidad de que una variable aleatoria continua tome valores en un cierto intervalo con la función de densidad, hay que:',
    [
      'Calcular la integral definida de la función de densidad en dicho intervalo.',
      'Calcular la diferencia entre el valor de la función de densidad en el límite superior del intervalo y el valor de la función en el límite inferior del intervalo.',
      'No es posible calcular la probabilidad con la función de densidad.',
      'Ninguna respuesta es correcta.'
    ],
    0,
    'P(a≤X≤b) = ∫_a^b f(x) dx.',
    'P(a≤X≤b) = ∫_a^b f(x) dx (integral definida de la densidad).',
    'Incorrecto. Es integral definida ∫_a^b f. Restar valores de f en los extremos sería con F, no con f.'
  ),
  mk(UD3,
    'Para calcular probabilidades en variable aleatoria continua, podemos utilizar:',
    [
      'Únicamente la función de densidad.',
      'Únicamente la función de distribución.',
      'La función de densidad y la función de distribución.',
      'Ninguna respuesta es correcta.'
    ],
    2,
    'f integrando o F restando.',
    'En VA continua sirve la densidad (integrando) o la distribución F(b)-F(a).',
    'Incorrecto. Ambas valen según el método (integral con f o diferencia con F).'
  ),
  mk(UD3,
    'Si una variable aleatoria es continua, la probabilidad puntual:',
    ['Es igual a 0.', 'Es igual a 1.', 'Está entre 0 y 1.', 'Ninguna respuesta es correcta.'],
    0,
    '∫_a^a f = 0.',
    'En VA continua P(X=a)=0: la integral de f sobre un punto es 0.',
    'Incorrecto. En continua P(X=a)=0 siempre; las probabilidades se asignan a intervalos.'
  ),
  mk(UD3,
    'La función de densidad de la distribución normal:',
    [
      'Recibe el nombre de Campana de Gauss y el área debajo de la función es igual a 1.',
      'No recibe ningún nombre específico y el área debajo de la función es igual a 0,5.',
      'Recibe el nombre de Campana de Gauss y el área debajo de la función es igual a 0,5.',
      'Ninguna respuesta es correcta'
    ],
    0,
    'Gauss, área total = 1.',
    'Densidad normal = Campana de Gauss. Su área total bajo la curva es 1 (probabilidad total).',
    'Incorrecto. Campana de Gauss y área total = 1. El 0,5 sería medio reparto por simetría.'
  )
]

const out = cur.concat(ud1, ud3)
fs.writeFileSync(target, JSON.stringify(out, null, 2))
console.log('total ahora:', out.length, '(+', ud1.length + ud3.length, ')')
