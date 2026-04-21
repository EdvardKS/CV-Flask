"""Tooltips for individual fields and chart explanations."""
ERROR_TOOLTIPS = {
    'Doble_Falta': 'Se suma cuando se pierden los dos servicios. Indica falta de concentración o técnica de saque.',
    'Resto_Derecha_Fallado': 'Error al devolver el saque con la derecha. Corta el punto antes de construir el intercambio.',
    'Resto_Reves_Fallado': 'Error al devolver el saque con el revés. Penaliza el inicio del punto y la lectura del servicio rival.',
    'Globo_Malo': 'Globo que se queda corto o que va directo al cristal de fondo.',
    'Error_Fondo_Derecha': 'Fallo no forzado de derecha desde el fondo, incluida salida de pared, que no supera la red o cede el punto.',
    'Error_Fondo_Reves': 'Fallo no forzado de revés desde el fondo, incluida salida de pared, que no supera la red o cede el punto.',
    'Bajada_Derecha_Error': 'Error en una bajada de pared o bajada de bola con la derecha que termina en fallo no forzado.',
    'Bajada_Reves_Error': 'Error en una bajada de pared o bajada de bola con el revés que termina en fallo no forzado.',
    'Posicionamiento_Fondo_Error': 'Mala colocación en el fondo que provoca distancia incorrecta a la bola, mala lectura o pérdida del punto.',
    'Error_Volea_Derecha': 'Error no forzado de volea de derecha en transición o en zona de definición.',
    'Error_Volea_Reves': 'Error no forzado de volea de revés en transición o en zona de definición.',
    'Posicionamiento_Volea_Error': 'Mala colocación o ajuste en zona de volea que genera el error no forzado.',
    'Tirar_Ficha_Error': 'Acción táctica aleatoria o precipitada al tirar ficha que rompe la estructura del punto y acaba en fallo.',
    'Bandeja_Error': 'Error en bandeja o víbora que va a la red o al cristal sin ser una bola comprometida.',
    'Smash_Error': 'Smash que no se trae a campo propio, no sale x4/x3 o acaba en la red o los cristales.',
}

SUCCESS_TOOLTIPS = {
    'Winner_Derecha': 'Golpe de fondo potente o angulado con la mano dominante que el rival no puede tocar.',
    'Winner_Reves': 'Punto directo de revés, plano o cortado, que supera al rival por velocidad o colocación.',
    'Resto_Ganador_Derecha': 'Devolución de saque con la derecha que termina en punto o deja una bola muerta.',
    'Resto_Ganador_Reves': 'Resto agresivo de revés que descoloca totalmente a la pareja que saca.',
    'Globo_De_Oro': 'Globo preciso que sobrepasa a los rivales y bota profundo para tomar la red con ventaja total.',
    'Chiquita_Ganadora': 'Bola suave a los pies del rival que fuerza el error o habilita el contraataque definitivo.',
    'Bajada_De_Pared': 'Ataque agresivo tras rebote en pared de fondo que termina en punto directo.',
    'Remate_Finalizador': 'Remate por arriba que saca la bola de la pista o la trae al campo propio para cerrar.',
    'Volea_Derecha_Ganadora': 'Volea de derecha firme, profunda o con ángulo que no vuelve.',
    'Volea_Reves_Ganadora': 'Volea de revés cruzada o al cuerpo que define el punto en la red.',
    'Bandeja_Vibora_Definitiva': 'Bandeja o víbora ejecutada con agresividad o efecto suficiente para cerrar el punto.',
    'Volea_Bloqueo_Contraataque': 'Punto ganado al bloquear un golpe fuerte rival y usar su potencia para abrir espacio.',
    'Dormilona': 'Volea con retroceso y mucho efecto que se queda pegada a la red tras el remate rival.',
}

FIELD_TOOLTIPS = {**ERROR_TOOLTIPS, **SUCCESS_TOOLTIPS}

GRAPH_TOOLTIPS = {
    'profile-radar': 'Resume el score de cada gran fase del juego. Cuanto más lejos del centro, más consolidada está esa área.',
    'error-type': 'Ordena los errores no forzados del filtro activo para localizar qué golpe está rompiendo más el rendimiento.',
    'success-type': 'Mide qué acciones ganadoras están generando más valor real para el jugador.',
    'phase-compare': 'Compara aciertos, errores y balance por fase de juego para detectar dónde produce y dónde se cae.',
    'hand-compare': 'Cruza derecha y revés para saber en qué mano el jugador genera más balance positivo o sufre más.',
    'block-balance': 'Resume la batalla entre fondo y red, comparando volumen de acierto, error y balance neto.',
    'set-trend': 'Sigue el comportamiento set a set para ver si el jugador mantiene el nivel o se desordena con el paso del partido.',
    'impact-breakdown': 'Pondera el peso real de los aciertos y errores por familias de impacto, no solo por volumen bruto.',
    'training-priority': 'Marca qué correcciones darían más retorno inmediato en pista según frecuencia y coste del error.',
    'match-compare': 'Sirve para comparar partidos completos y ver si el rendimiento es estable o cambia mucho según contexto.',
}
