from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMP_REDES_DIR = ROOT / "temp" / "REDES"
PUBLIC_DIR = ROOT / "public" / "data" / "quiz"
REDES_DIR = PUBLIC_DIR / "redes"
EXAMENES_CLASE_PATH = Path(__file__).resolve().parent / "redes_examenes_clase.json"


SUSPICIOUS_MOJIBAKE = ("Â", "Ã", "â", "ð")
WORD_FIXES = {
    "Introducci?n": "Introducción",
    "interconexi?n": "interconexión",
    "configuraci?n": "configuración",
    "Aut?nomo": "Autónomo",
    "Categor?as": "Categorías",
    "Espa?a": "España",
    "Se?ala": "Señala",
    "Sit?a": "Sitúa",
    "abreviaci?n": "abreviación",
    "asim?trico": "asimétrico",
    "autenticaci?n": "autenticación",
    "autom?ticamente": "automáticamente",
    "b?sico": "básico",
    "c?mo": "cómo",
    "categor?a": "categoría",
    "categor?as": "categorías",
    "cl?sica": "clásica",
    "cl?sico": "clásico",
    "clasificaci?n": "clasificación",
    "conexi?n": "conexión",
    "decisi?n": "decisión",
    "detecci?n": "detección",
    "difusi?n": "difusión",
    "din?mico": "dinámico",
    "direcci?n": "dirección",
    "dise?o": "diseño",
    "dise?os": "diseños",
    "distribuci?n": "distribución",
    "env?o": "envío",
    "est?ndar": "estándar",
    "est?ndares": "estándares",
    "est?tico": "estático",
    "evitaci?n": "evitación",
    "exposici?n": "exposición",
    "f?sica": "física",
    "f?sicamente": "físicamente",
    "f?sicas": "físicas",
    "f?sicos": "físicos",
    "inal?mbricas": "inalámbricas",
    "informaci?n": "información",
    "ingenier?a": "ingeniería",
    "instalaci?n": "instalación",
    "l?gica": "lógica",
    "l?gicos": "lógicos",
    "l?mites": "límites",
    "m?s": "más",
    "m?trica": "métrica",
    "mec?nica": "mecánica",
    "n?cleo": "núcleo",
    "notaci?n": "notación",
    "p?gina": "página",
    "pol?ticas": "políticas",
    "pr?cticos": "prácticos",
    "priorizaci?n": "priorización",
    "protecci?n": "protección",
    "qu?": "qué",
    "relaci?n": "relación",
    "representaci?n": "representación",
    "se?al": "señal",
    "segmentaci?n": "segmentación",
    "sim?trico": "simétrico",
    "simplificaci?n": "simplificación",
    "t?cnicas": "técnicas",
    "t?neles": "túneles",
    "t?pico": "típico",
    "tama?o": "tamaño",
    "tecnol?gica": "tecnológica",
    "tecnolog?as": "tecnologías",
    "teor?a": "teoría",
    "topolog?a": "topología",
    "tr?fico": "tráfico",
    "transici?n": "transición",
    "transmisi?n": "transmisión",
    "visi?n": "visión",
}

CONCEPT_TOPIC_TITLES = {
    1: "Tema 1 · Introducción y dispositivos de interconexión",
    2: "Tema 2 · LAN, backbone, VPN y VLAN",
    3: "Tema 3 · Cableado estructurado",
    4: "Tema 4 · Encaminamiento dinámico",
    5: "Tema 5 · IPv6",
    6: "Tema 6 · Seguridad en las comunicaciones",
}

QUIZ_TITLE_BY_SOURCE = {
    "Examen Tipo Test_tema 1.2.pdf": "Tema 1.2 · Dispositivos de interconexión",
    "Tema 1.3.-Examen tipo test.pdf": "Tema 1.3 · Pasarelas, QoS y configuración básica",
    "Tema 2.1.-Examen Test.pdf": "Tema 2.1 · LAN y protocolos de acceso",
    "Tema 2.2.-Examen tipo test.pdf": "Tema 2.2 · Ethernet, WiFi y backbone",
}

TOPIC_TITLES = {
    1: "Tema 1 · Introducción, interconexión y configuración",
    2: "Tema 2 · LAN, backbone, VPN y VLAN",
    3: "Tema 3 · Cableado estructurado",
    4: "Tema 4 · Encaminamiento dinámico",
    5: "Tema 5 · IPv6",
    6: "Tema 6 · Seguridad en las comunicaciones",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def maybe_fix_mojibake(text: str) -> str:
    fixed = text
    if any(token in fixed for token in SUSPICIOUS_MOJIBAKE):
        try:
            candidate = fixed.encode("latin1").decode("utf-8")
            fixed = candidate
        except UnicodeError:
            pass
    for src, dst in WORD_FIXES.items():
        fixed = fixed.replace(src, dst)
    return fixed


def deep_fix(value):
    if isinstance(value, str):
        return maybe_fix_mojibake(value)
    if isinstance(value, list):
        return [deep_fix(item) for item in value]
    if isinstance(value, dict):
        return {key: deep_fix(item) for key, item in value.items()}
    return value


def slugify(text: str) -> str:
    lowered = maybe_fix_mojibake(text).lower()
    lowered = lowered.replace("º", "o")
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    lowered = re.sub(r"-{2,}", "-", lowered)
    return lowered.strip("-")


def question(topic: int, q: str, options: list[str], correct_index: int, **extra):
    payload = {
        "kind": "choice",
        "q": q,
        "options": options,
        "correctIndex": correct_index,
        "cuatrimestre": 2,
        "category": f"tema-{topic}",
    }
    payload.update(extra)
    return payload


def make_quiz(topic: int, quiz_id: str, title: str, source_file: str, source_type: str, questions: list[dict]):
    return {
        "id": quiz_id,
        "topic": topic,
        "title": title,
        "sourceFile": source_file,
        "sourceType": source_type,
        "questionCount": len(questions),
        "questions": questions,
    }


def build_support_materials() -> dict[int, list[dict]]:
    result: dict[int, list[dict]] = {}
    for topic_dir in sorted(TEMP_REDES_DIR.glob("tema *")):
        topic = int(topic_dir.name.split()[-1])
        materials = []
        for path in sorted(topic_dir.iterdir()):
            if not path.is_file():
                continue
            name = path.name
            lowered = name.lower()
            if lowered.endswith(".pdf") and "contenido teórico" in lowered:
                source_type = "pdf-teorico"
            elif lowered.endswith(".pptx"):
                source_type = "pptx-convertido"
            elif lowered.endswith(".pdf") and ("ejercicio" in lowered or "solución" in lowered):
                source_type = "pdf-ejercicio"
            elif lowered.endswith(".pdf") and "examen" in lowered:
                source_type = "pdf-cuestionario"
            else:
                continue
            materials.append(
                {
                    "id": slugify(f"{topic}-{name}"),
                    "title": name.rsplit(".", 1)[0],
                    "sourceFile": name,
                    "sourceType": source_type,
                    "questionCount": 0,
                }
            )
        result[topic] = materials
    return result


def build_manual_quizzes() -> list[dict]:
    return [
        make_quiz(
            1,
            "tema-1-introduccion-capturas-profesor",
            "Tema 1 · Introducción a las redes (capturas del profesor)",
            "Captura de pantalla 2026-05-07 102329.png + Captura de pantalla 2026-05-07 102345.png",
            "png-ocr",
            [
                question(1, "¿Cuál es el objetivo principal de una red de computadoras?", ["Aumentar la potencia de los dispositivos", "Compartir información y recursos entre dispositivos", "Ejecutar aplicaciones más rápido", "Reducir el consumo energético"], 1, sourceFile="Captura de pantalla 2026-05-07 102329.png", sourceType="png-ocr", evidence="Introducción general a redes y comunicación entre nodos."),
                question(1, "¿Cuál de los siguientes NO es un componente básico de una red?", ["Nodos", "Medios de transmisión", "Protocolos", "Sistemas operativos"], 3, sourceFile="Captura de pantalla 2026-05-07 102329.png", sourceType="png-ocr", evidence="El temario distingue nodos, medios y protocolos como elementos de red."),
                question(1, "¿Qué dispositivo se considera un nodo dentro de una red?", ["Solo servidores", "Solo ordenadores personales", "Cualquier dispositivo conectado a la red", "Únicamente routers"], 2, sourceFile="Captura de pantalla 2026-05-07 102329.png", sourceType="png-ocr", evidence="El contenido introductorio define nodo como cualquier equipo conectado."),
                question(1, "¿Qué función cumplen los protocolos de red?", ["Aumentar la velocidad del hardware", "Establecer reglas de comunicación entre dispositivos", "Proteger físicamente los cables", "Reducir el tráfico de red"], 1, sourceFile="Captura de pantalla 2026-05-07 102329.png", sourceType="png-ocr", evidence="El material explica que la arquitectura lógica define reglas y protocolos."),
                question(1, "¿En qué tipo de aplicaciones se suele usar UDP?", ["Descargas de archivos", "Transacciones bancarias", "Streaming y videollamadas", "Correo electrónico"], 2, sourceFile="Captura de pantalla 2026-05-07 102345.png", sourceType="png-ocr", evidence="La comparación de servicios orientados y no orientados a conexión prioriza baja latencia en tiempo real."),
                question(1, "¿Qué protocolo se encarga de traducir nombres de dominio a direcciones IP?", ["HTTP", "FTP", "DNS", "SMTP"], 2, sourceFile="Captura de pantalla 2026-05-07 102345.png", sourceType="png-ocr", evidence="La configuración básica del tema 1 dedica una diapositiva específica a DNS."),
                question(1, "¿Qué capa es la más cercana al usuario?", ["Transporte", "Red", "Aplicación", "Enlace"], 2, sourceFile="Captura de pantalla 2026-05-07 102345.png", sourceType="png-ocr", evidence="Los modelos OSI y TCP/IP sitúan la aplicación como capa superior."),
                question(1, "¿Qué describe una topología de red?", ["El sistema operativo utilizado", "La forma de interconectar los dispositivos", "El tipo de protocolo", "El direccionamiento IP"], 1, sourceFile="Captura de pantalla 2026-05-07 102345.png", sourceType="png-ocr", evidence="La introducción usa topología para describir organización física de la red."),
                question(1, "¿Qué topología utiliza un nodo central?", ["Bus", "Anillo", "Estrella", "Malla"], 2, sourceFile="Captura de pantalla 2026-05-07 102345.png", sourceType="png-ocr", evidence="El repaso de topologías distingue la estrella por su nodo central."),
            ],
        ),
        make_quiz(
            2,
            "tema-2-backbone-capturas-profesor",
            "Tema 2.3 · Interconexión de redes (capturas del profesor)",
            "Captura de pantalla 2026-05-07 102551.png",
            "png-ocr",
            [
                question(2, "¿Qué es una red backbone?", ["Una red local de usuarios", "Una red inalámbrica", "Una red troncal de alta velocidad", "Una red doméstica"], 2, sourceFile="Captura de pantalla 2026-05-07 102551.png", sourceType="png-ocr", evidence="El tema 2 define backbone como infraestructura troncal principal."),
                question(2, "¿Qué medio se utiliza principalmente en redes backbone?", ["Par trenzado", "Coaxial", "Fibra óptica", "Bluetooth"], 2, sourceFile="Captura de pantalla 2026-05-07 102551.png", sourceType="png-ocr", evidence="Las diapositivas de backbone remarcan la fibra por capacidad y distancia."),
                question(2, "¿Cuál es una característica clave del backbone?", ["Baja capacidad", "Alta latencia", "Alta velocidad", "Baja seguridad"], 2, sourceFile="Captura de pantalla 2026-05-07 102551.png", sourceType="png-ocr", evidence="La red troncal se caracteriza por transportar tráfico agregado a alta velocidad."),
                question(2, "¿Qué protocolo se utiliza en redes backbone para enrutamiento?", ["HTTP", "FTP", "OSPF", "SMTP"], 2, sourceFile="Captura de pantalla 2026-05-07 102551.png", sourceType="png-ocr", evidence="El material de interconexión enlaza backbone y enrutamiento interno con OSPF."),
                question(2, "¿Qué problema introduce la distancia en redes?", ["Mayor seguridad", "Mayor latencia", "Mayor ancho de banda", "Menor coste"], 1, sourceFile="Captura de pantalla 2026-05-07 102551.png", sourceType="png-ocr", evidence="La teoría compara distancias y tiempos de respuesta como restricción de diseño."),
            ],
        ),
        make_quiz(
            3,
            "tema-3-cableado-capturas-profesor",
            "Tema 3.1 · Cableado estructurado (capturas del profesor)",
            "Captura de pantalla 2026-05-07 102611.png",
            "png-ocr",
            [
                question(3, "¿Qué es el cableado estructurado?", ["Un sistema de cableado provisional para redes pequeñas", "Un sistema de cableado diseñado de manera ordenada y estandarizada para transportar señales de voz, datos y otros sistemas de comunicación", "Un sistema exclusivo para telefonía analógica", "Un conjunto de cables sin necesidad de normas técnicas"], 1, sourceFile="Captura de pantalla 2026-05-07 102611.png", sourceType="png-ocr", evidence="El tema 3 abre definiendo el cableado estructurado como infraestructura ordenada y normalizada."),
                question(3, "¿Cuál de las siguientes es una característica del cableado estructurado?", ["Dependencia de un solo fabricante", "Infraestructura única y arquitectura abierta", "Uso exclusivo de fibra óptica", "Aplicación limitada a redes domésticas"], 1, sourceFile="Captura de pantalla 2026-05-07 102611.png", sourceType="png-ocr", evidence="Las diapositivas remarcan interoperabilidad y arquitectura abierta."),
                question(3, "Antes de la estandarización, una de las principales consecuencias era:", ["Mayor compatibilidad entre fabricantes", "Reducción de costes de mantenimiento", "Incompatibilidad entre sistemas propietarios", "Menor necesidad de documentación"], 2, sourceFile="Captura de pantalla 2026-05-07 102611.png", sourceType="png-ocr", evidence="La motivación del estándar es precisamente evitar sistemas propietarios incompatibles."),
            ],
        ),
        make_quiz(
            1,
            "tema-1-repaso-del-temario",
            "Tema 1 · Repaso del temario",
            "Tema1  (parte1).pptx + Tema 1.-(parte2).pptx + Tema 1 (parte 3)-Redes_Informáticas_Pasarelas,QoS.pptx",
            "pptx-convertido",
            [
                question(1, "¿Qué define la arquitectura de red?", ["El sistema operativo de los equipos", "La estructura, diseño y funcionamiento de una red de computadoras", "Solo el cableado físico", "Únicamente las direcciones IP"], 1, sourceFile="Tema1  (parte1).pptx", sourceType="pptx-convertido", sourceSlide=11, evidence="La diapositiva '¿Qué es la Arquitectura de Red?' lo define de forma literal."),
                question(1, "¿Qué pertenece a la arquitectura lógica de una red?", ["Cables y racks", "Direcciones IP, VLAN y reglas de enrutamiento", "Conectores RJ45", "La climatización de la sala"], 1, sourceFile="Tema1  (parte1).pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="La comparación entre arquitectura física y lógica menciona IP, VLAN y enrutamiento."),
                question(1, "¿Qué dispositivo reenvía tráfico basándose en direcciones MAC y aporta puertos dedicados?", ["Hub", "Repetidor", "Switch", "Módem"], 2, sourceFile="Tema 1.-(parte2).pptx", sourceType="pptx-convertido", sourceSlide=13, evidence="La diapositiva de switches destaca conmutación por MAC y ancho de banda por puerto."),
                question(1, "¿Qué problema es típico de repetidores y hubs?", ["Asignación errónea de DNS", "Colisiones y ancho de banda compartido", "Incompatibilidad con IPv6", "Falta de direcciones MAC"], 1, sourceFile="Tema 1.-(parte2).pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="Las limitaciones recogidas son colisiones, ancho de banda compartido y poca seguridad."),
                question(1, "¿Para qué sirve QoS en redes?", ["Para cifrar el tráfico", "Para priorizar tráfico sensible al tiempo y mejorar la experiencia", "Para sustituir al direccionamiento IP", "Para eliminar la puerta de enlace"], 1, sourceFile="Tema 1 (parte 3)-Redes_Informáticas_Pasarelas,QoS.pptx", sourceType="pptx-convertido", sourceSlide=1, evidence="La introducción del bloque de QoS la vincula a aplicaciones sensibles al tiempo."),
            ],
        ),
        make_quiz(
            2,
            "tema-2-repaso-del-temario",
            "Tema 2 · Repaso del temario",
            "Tema_2_1.pptx + Tema 2 (parte 2).pptx + Tema 2 (parte 3).pptx",
            "pptx-convertido",
            [
                question(2, "¿Qué caracteriza a una LAN según el temario?", ["Opera bajo un único dominio administrativo en un área limitada", "Siempre usa satélite", "Está pensada solo para hogares", "No admite segmentación lógica"], 0, sourceFile="Tema_2_1.pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="La diapositiva de LAN amplía la definición con dominio administrativo único y alcance limitado."),
                question(2, "¿Qué tecnología PAN está orientada a sensores de bajo consumo y topología en malla?", ["Ethernet", "Zigbee", "WiFi 6", "MPLS"], 1, sourceFile="Tema_2_1.pptx", sourceType="pptx-convertido", sourceSlide=11, evidence="La diapositiva de Zigbee cita bajo consumo, 802.15.4 y topología en malla."),
                question(2, "¿Qué estándar IEEE define Ethernet a 400 Gbps?", ["802.11ax", "802.3bs", "802.1Q", "802.15.4"], 1, sourceFile="Tema 2 (parte 2).pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="La diapositiva '400GbE: La Frontera Actual' menciona explícitamente 802.3bs."),
                question(2, "¿Qué ventaja se destaca de las VPN en entornos corporativos?", ["Reducen seguridad", "Sustituyen completamente Internet", "Permiten acceso seguro a recursos corporativos sobre Internet", "Eliminan la autenticación"], 2, sourceFile="Tema 2 (parte 3).pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="La definición y beneficios de VPN recalcan tunelización, cifrado y acceso seguro."),
                question(2, "¿Qué permite una VLAN según el tema 2?", ["Separar dominios lógicos sobre la misma infraestructura física", "Convertir Ethernet en Bluetooth", "Eliminar la capa de acceso", "Aumentar el tamaño de las tramas"], 0, sourceFile="Tema 2 (parte 3).pptx", sourceType="pptx-convertido", sourceSlide=1, evidence="La presentación de tecnologías avanzadas usa VLAN como mecanismo de segmentación lógica."),
            ],
        ),
        make_quiz(
            3,
            "tema-3-repaso-del-temario",
            "Tema 3 · Repaso del temario",
            "Tema 3 (parte1).pptx + Tema 3. (parte 2).pptx + Tema 3 (parte 3).pptx",
            "pptx-convertido",
            [
                question(3, "¿Qué estándar organiza de forma central la instalación física del cableado estructurado?", ["IEEE 802.11", "ANSI/TIA/EIA-568", "BGP", "SLAAC"], 1, sourceFile="Tema 3 (parte1).pptx", sourceType="pptx-convertido", sourceSlide=17, evidence="La guía de conceptos y la teoría destacan ANSI/TIA/EIA-568 como referencia principal."),
                question(3, "¿Qué norma trata específicamente de canalizaciones y espacios de telecomunicaciones?", ["TIA-607", "TIA-569", "TIA-942", "IEC 61156"], 1, sourceFile="Tema 3 (parte1).pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="La diapositiva de TIA-569 la dedica a canalizaciones y espacios."),
                question(3, "¿Qué medio es hoy la opción predominante para el backbone vertical de edificios?", ["Cable coaxial", "Par trenzado básico", "Fibra óptica", "Bluetooth"], 2, sourceFile="Tema 3. (parte 2).pptx", sourceType="pptx-convertido", sourceSlide=11, evidence="El backbone vertical se describe hoy principalmente sobre fibra óptica."),
                question(3, "¿Qué diferencia principal hay entre fibra multimodo y monomodo?", ["La multimodo solo sirve para audio", "La monomodo permite mayores distancias al evitar la dispersión modal", "La multimodo requiere láseres más costosos", "La monomodo no usa núcleo"], 1, sourceFile="Tema 3 (parte 3).pptx", sourceType="pptx-convertido", sourceSlide=13, evidence="La comparativa MMF vs SMF explica la dispersión modal y el mayor alcance de SMF."),
                question(3, "¿Qué función tiene la puesta a tierra según TIA-607?", ["Aumentar el ancho de banda", "Garantizar un potencial común y proteger equipos y personas", "Reducir la longitud de los enlaces", "Asignar direcciones IP"], 1, sourceFile="Tema 3 (parte1).pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="La diapositiva de TIA-607 explica protección frente a diferencias de potencial y descargas."),
            ],
        ),
        make_quiz(
            4,
            "tema-4-repaso-del-temario",
            "Tema 4 · Repaso del temario",
            "Tema.4.1.-Encaminamiento-Dinamico-y-Sistemas-Autonomos.pptx",
            "pptx-convertido",
            [
                question(4, "¿Qué persigue el encaminamiento dinámico frente al estático?", ["Evitar completamente las tablas de rutas", "Adaptarse automáticamente a cambios de topología", "Eliminar los sistemas autónomos", "Trabajar solo con MAC"], 1, sourceFile="Tema.4.1.-Encaminamiento-Dinamico-y-Sistemas-Autonomos.pptx", sourceType="pptx-convertido", sourceSlide=1, evidence="La introducción del tema presenta el encaminamiento dinámico como adaptación automática."),
                question(4, "¿Qué es un sistema autónomo (AS)?", ["Un único router doméstico", "Un conjunto de redes IP bajo una política de encaminamiento unificada", "Una VLAN extendida", "Una tabla de ARP pública"], 1, sourceFile="Tema.4.1.-Encaminamiento-Dinamico-y-Sistemas-Autonomos.pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="La definición de AS aparece literalmente en la diapositiva correspondiente."),
                question(4, "¿Cómo se identifica de forma única un sistema autónomo?", ["Con una MAC troncal", "Con un ASN", "Con un SSID", "Con una máscara /24"], 1, sourceFile="Tema.4.1.-Encaminamiento-Dinamico-y-Sistemas-Autonomos.pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="El tema remarca que cada AS se identifica por un número ASN."),
                question(4, "¿Qué tipo de AS transporta tráfico entre distintos sistemas autónomos?", ["AS Stub", "AS Multiconectado", "AS de Tránsito", "AS Local"], 2, sourceFile="Tema.4.1.-Encaminamiento-Dinamico-y-Sistemas-Autonomos.pptx", sourceType="pptx-convertido", sourceSlide=13, evidence="La clasificación de AS reserva el tránsito para los AS que intermedian tráfico entre otros AS."),
                question(4, "¿Quién administra la asignación pública de ASN a través de registros regionales?", ["IEEE", "IANA y los RIR", "ISO y TIA", "ICANN y DHCP"], 1, sourceFile="Tema.4.1.-Encaminamiento-Dinamico-y-Sistemas-Autonomos.pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="La diapositiva de ASN cita IANA y los registros regionales de Internet."),
            ],
        ),
        make_quiz(
            5,
            "tema-5-repaso-del-temario",
            "Tema 5 · Repaso del temario",
            "IPv6-El-Futuro-de-Internet.pptx",
            "pptx-convertido",
            [
                question(5, "¿Cuál es el tamaño de una dirección IPv6?", ["32 bits", "64 bits", "128 bits", "256 bits"], 2, sourceFile="IPv6-El-Futuro-de-Internet.pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="La diapositiva de direccionamiento expandido compara 128 bits frente a 32 bits en IPv4."),
                question(5, "¿Qué mecanismo permite autoconfigurar una dirección IPv6 sin intervención manual?", ["NAT", "SLAAC", "VLAN", "STP"], 1, sourceFile="IPv6-El-Futuro-de-Internet.pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="La presentación dedica una diapositiva completa a la autoconfiguración SLAAC."),
                question(5, "¿Qué ventaja central se destaca de IPv6 sobre IPv4?", ["Menor longitud de dirección", "Espacio de direcciones enormemente mayor", "No necesita routers", "Usa solo direcciones privadas"], 1, sourceFile="IPv6-El-Futuro-de-Internet.pptx", sourceType="pptx-convertido", sourceSlide=11, evidence="La comparativa de espacio de direcciones es el argumento principal del tema."),
                question(5, "¿Qué tecnología de seguridad se presenta como parte integral de IPv6?", ["ARP", "FTP", "IPsec", "SNMP"], 2, sourceFile="IPv6-El-Futuro-de-Internet.pptx", sourceType="pptx-convertido", sourceSlide=13, evidence="La diapositiva 'Seguridad Integrada: IPsec' lo señala explícitamente."),
                question(5, "¿Qué hace primero un router en SLAAC para que los equipos se configuren?", ["Envía información del prefijo de red", "Asigna MAC aleatorias", "Activa un túnel SSL", "Pide credenciales al usuario"], 0, sourceFile="IPv6-El-Futuro-de-Internet.pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="El flujo de SLAAC empieza con el anuncio del prefijo por parte del router."),
            ],
        ),
        make_quiz(
            6,
            "tema-6-repaso-del-temario",
            "Tema 6 · Repaso del temario",
            "Tema 6.-Seguridad-en-las-Comunicaciones-y-el-Ciberespacio.pptx",
            "pptx-convertido",
            [
                question(6, "¿Qué motivación se destaca como principal en muchos cibercriminales?", ["Curiosidad académica", "Beneficio económico", "Diseño de hardware", "Mantenimiento preventivo"], 1, sourceFile="Tema 6.-Seguridad-en-las-Comunicaciones-y-el-Ciberespacio.pptx", sourceType="pptx-convertido", sourceSlide=10, evidence="La diapositiva de ciberdelincuencia abre con la motivación económica."),
                question(6, "¿Qué diferencia básica se remarca entre hacking ético y cibercrimen?", ["El hacking ético usa más ancho de banda", "El hacking ético actúa con autorización previa", "El cibercrimen solo afecta a IoT", "El hacking ético no reporta vulnerabilidades"], 1, sourceFile="Tema 6.-Seguridad-en-las-Comunicaciones-y-el-Ciberespacio.pptx", sourceType="pptx-convertido", sourceSlide=13, evidence="El ejercicio comparativo contrapone autorización y mejora de seguridad frente a explotación maliciosa."),
                question(6, "¿Qué tipo de ataque secuestra datos para exigir un pago?", ["Supply chain", "Zero-day", "Ransomware", "Phishing DNS"], 2, sourceFile="Tema 6.-Seguridad-en-las-Comunicaciones-y-el-Ciberespacio.pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="La diapositiva de ataques recientes enumera el ransomware como secuestro de datos."),
                question(6, "¿Qué persigue un grupo hacktivista según el temario?", ["Reducir la latencia de Internet", "Promover causas políticas o sociales con visibilidad mediática", "Documentar cableado estructurado", "Crear topologías físicas"], 1, sourceFile="Tema 6.-Seguridad-en-las-Comunicaciones-y-el-Ciberespacio.pptx", sourceType="pptx-convertido", sourceSlide=11, evidence="La diapositiva de ciberactivistas lo vincula a causas políticas o sociales y atención mediática."),
                question(6, "¿Qué problema describe un ataque zero-day?", ["Un fallo ya parchado", "La explotación de una vulnerabilidad desconocida en software crítico", "Un acceso físico no autorizado al CPD", "Una conexión VPN lenta"], 1, sourceFile="Tema 6.-Seguridad-en-las-Comunicaciones-y-el-Ciberespacio.pptx", sourceType="pptx-convertido", sourceSlide=12, evidence="La diapositiva de ataques recientes define zero-day como vulnerabilidad desconocida."),
            ],
        ),
    ]


def _normalize_question(text: str) -> str:
    lowered = maybe_fix_mojibake(text or "").lower()
    return re.sub(r"[^a-z0-9áéíóúñü]+", "", lowered)


def build_examenes_clase_quizzes(existing_questions: set[str]) -> list[dict]:
    if not EXAMENES_CLASE_PATH.exists():
        return []
    data = json.loads(EXAMENES_CLASE_PATH.read_text(encoding="utf-8"))
    quizzes: list[dict] = []
    for tema_key in sorted(data.keys()):
        topic_num = int(tema_key.split("-")[1])
        seen_in_quiz: set[str] = set()
        questions: list[dict] = []
        entries = sorted(data[tema_key], key=lambda item: (item.get("ud", ""), item.get("number", 0)))
        for entry in entries:
            norm = _normalize_question(entry["q"])
            if not norm or norm in existing_questions or norm in seen_in_quiz:
                continue
            seen_in_quiz.add(norm)
            questions.append(
                question(
                    topic_num,
                    entry["q"],
                    entry["options"],
                    entry["correctIndex"],
                    sourceFile=entry["sourceFile"],
                    sourceType="pdf-cuestionario-clase",
                    ud=entry.get("ud"),
                )
            )
        if not questions:
            continue
        quizzes.append(
            make_quiz(
                topic_num,
                f"tema-{topic_num}-examenes-de-clase",
                f"Tema {topic_num} · Exámenes de clase",
                ", ".join(sorted({q["sourceFile"] for q in questions})),
                "pdf-cuestionario-clase",
                questions,
            )
        )
    return quizzes


def build_temario_manifest() -> dict:
    base = deep_fix(load_json(REDES_DIR / "temario.json"))
    generated_quizzes = build_manual_quizzes()
    generated_ids = {quiz["id"] for quiz in generated_quizzes}
    topics = {topic["topic"]: topic for topic in base["topics"]}
    for topic_num in range(1, 7):
        topics.setdefault(
            topic_num,
            {"id": f"tema-{topic_num}", "topic": topic_num, "title": TOPIC_TITLES[topic_num], "supportMaterials": [], "quizzes": []},
        )
        topics[topic_num]["title"] = TOPIC_TITLES[topic_num]
        topics[topic_num]["supportMaterials"] = build_support_materials().get(topic_num, [])
        topics[topic_num]["quizzes"] = [quiz for quiz in topics[topic_num]["quizzes"] if quiz["id"] not in generated_ids]
        for quiz in topics[topic_num]["quizzes"]:
            quiz["title"] = QUIZ_TITLE_BY_SOURCE.get(quiz["sourceFile"], quiz["title"])
            quiz["sourceType"] = quiz.get("sourceType") or "pdf-cuestionario"
            fixed_questions = []
            for item in quiz["questions"]:
                fixed = deep_fix(item)
                fixed.setdefault("sourceFile", quiz["sourceFile"])
                fixed.setdefault("sourceType", quiz["sourceType"])
                fixed_questions.append(fixed)
            quiz["questions"] = fixed_questions
            quiz["questionCount"] = len(quiz["questions"])

    for quiz in generated_quizzes:
        topic = topics[quiz["topic"]]
        topic["quizzes"].append(quiz)

    existing_questions: set[str] = set()
    for topic in topics.values():
        for quiz in topic["quizzes"]:
            for item in quiz["questions"]:
                norm = _normalize_question(item.get("q", ""))
                if norm:
                    existing_questions.add(norm)
    for quiz in build_examenes_clase_quizzes(existing_questions):
        topics[quiz["topic"]]["quizzes"].append(quiz)

    ordered_topics = []
    for topic_num in range(1, 7):
        topic = topics[topic_num]
        topic["quizzes"] = sorted(topic["quizzes"], key=lambda item: item["id"])
        ordered_topics.append(topic)
    return {"subjectId": "redes", "topics": ordered_topics}


def build_concepts_manifest() -> dict:
    base = deep_fix(load_json(REDES_DIR / "concepts.json"))
    for topic in base["topics"]:
        topic["title"] = CONCEPT_TOPIC_TITLES.get(topic["topic"], topic["title"])
        topic["slides"] = [deep_fix(slide) for slide in topic["slides"]]
    return base


def build_flat_questions(temario_manifest: dict) -> list[dict]:
    questions = []
    for topic in temario_manifest["topics"]:
        for quiz in topic["quizzes"]:
            for item in quiz["questions"]:
                questions.append(deepcopy(item))
    return questions


def write_json(path: Path, payload) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    temario = build_temario_manifest()
    concepts = build_concepts_manifest()
    flat_questions = build_flat_questions(temario)
    write_json(REDES_DIR / "temario.json", temario)
    write_json(REDES_DIR / "concepts.json", concepts)
    write_json(PUBLIC_DIR / "redes.json", flat_questions)


if __name__ == "__main__":
    main()
