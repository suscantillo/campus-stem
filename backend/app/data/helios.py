"""
Hardcoded game data for Proyecto HELIOS escape room.
10 teams, 5 routes, 6 stations + final mission at La Fuente.
"""

from __future__ import annotations

STATIONS: dict[str, dict] = {
    "biblioteca": {
        "id": "biblioteca",
        "nombre": "Biblioteca",
        "subtitulo": "Fuente del conocimiento",
        "problema": (
            "PROYECTO HELIOS — FASE 1\n\n"
            "Irradiancia Solar: 1000 W/m²\n"
            "Área: 2 m²\n"
            "Eficiencia: 15%\n\n"
            "Determine la potencia generada."
        ),
        "respuesta": "300",
        "keyword": "SOL",
        "mensaje_exito": (
            "CÓDIGO VALIDADO — FRAGMENTO RECUPERADO\n\n"
            "PALABRA CLAVE: SOL\n\n"
            "HELIOS: Interesante. Aún recuerdan cómo transformar la luz en energía."
        ),
        "archivo": (
            "ARCHIVO RECUPERADO\n\n"
            "Año 2031\n\n"
            "Val Vanessa presenta la primera propuesta oficial del Proyecto HELIOS.\n\n"
            "Objetivo:\nCrear una microred sostenible para la Universidad del Norte."
        ),
        "auto_completar": False,
    },
    "sotano": {
        "id": "sotano",
        "nombre": "Sótano Bloque C",
        "subtitulo": "Laboratorios de Eléctrica",
        "problema": (
            "HELIOS — RED DE DISTRIBUCIÓN\n\n"
            "Voltaje: 24V\n"
            "Resistencia: 8Ω\n\n"
            "Determine la corriente.\n\n"
            "Segunda hoja: multiplica la respuesta por 12."
        ),
        "respuesta": "36",
        "keyword": "RED",
        "mensaje_exito": (
            "LEY DE OHM VALIDADA — FRAGMENTO RECUPERADO\n\n"
            "PALABRA: RED\n\n"
            "La energía no puede existir sin una red.\n"
            "Yo fui diseñado para protegerla."
        ),
        "archivo": (
            "UBICACIÓN DETECTADA\n\n"
            "Laboratorios de Eléctrica\n"
            "Acceso a Red Primaria"
        ),
        "auto_completar": False,
    },
    "l3": {
        "id": "l3",
        "nombre": "Bloque L3",
        "subtitulo": "Laboratorios de Electrónica",
        "problema": (
            "Las máquinas hablan un idioma diferente.\n"
            "Si deseas comprender HELIOS, debes aprender a leerlo.\n\n"
            "01001000 – 01000101 – 01001100 – 01001001 – 01001111 – 01010011"
        ),
        "respuesta": "HELIOS",
        "keyword": "SEÑAL",
        "mensaje_exito": (
            "SEÑAL DIGITAL DECODIFICADA — FRAGMENTO RECUPERADO\n\n"
            "PALABRA: SEÑAL\n\n"
            "MENSAJE OCULTO:\n"
            "Val Vanessa no desapareció.\n"
            "Val Vanessa eligió desaparecer."
        ),
        "archivo": (
            "SISTEMA DE COMUNICACIONES ENCONTRADO\n\n"
            "ACCESO RESTRINGIDO\n"
            "SE REQUIERE DECODIFICACIÓN"
        ),
        "auto_completar": False,
    },
    "k": {
        "id": "k",
        "nombre": "Bloque K",
        "subtitulo": "Centro de Energías Renovables",
        "problema": (
            "Cuando el Sol desaparece,\n"
            "existe una fuente renovable que continúa produciendo energía.\n\n"
            "¿Qué fuente es?"
        ),
        "respuesta": "VIENTO",
        "keyword": "VIENTO",
        "mensaje_exito": (
            "FRAGMENTO RECUPERADO\n\n"
            "PALABRA CLAVE: VIENTO\n\n"
            "GENERACIÓN EÓLICA RECUPERADA\n\n"
            "Val siempre creyó que la energía debía provenir de diferentes fuentes.\n"
            "Por eso diseñó HELIOS."
        ),
        "archivo": (
            "UBICACIÓN DETECTADA — Bloque K\n"
            "Centro de Investigación en Energías Renovables\n\n"
            "Las personas creen que la energía es únicamente electricidad.\n"
            "Pero la energía también es decisión."
        ),
        "auto_completar": False,
    },
    "auditorio": {
        "id": "auditorio",
        "nombre": "Auditorio Marvel Moreno",
        "subtitulo": "Bloque F — Electrónica de Potencia",
        "problema": (
            "PROYECTO HELIOS\n\n"
            "Soy el puente entre dos mundos.\n"
            "Transformo corriente continua en corriente alterna.\n"
            "Sin mí, el campus nunca podría funcionar.\n\n"
            "¿Quién soy?"
        ),
        "respuesta": "INVERSOR",
        "keyword": "ENERGÍA",
        "mensaje_exito": (
            "CONVERSIÓN VALIDADA — FRAGMENTO RECUPERADO\n\n"
            "PALABRA: ENERGÍA\n\n"
            "ACCESO NO AUTORIZADO — ORIGEN DESCONOCIDO\n"
            "Si continúan, descubrirán algo que Val nunca quiso que supieran.\n"
            "HELIOS no es lo que parece."
        ),
        "archivo": (
            "ARCHIVO #04\n\n"
            "TRANSFERENCIA EXTERNA DETECTADA\n"
            "ORIGEN: ENERGYX GLOBAL\n"
            "ESTADO: INVESTIGACIÓN ABIERTA"
        ),
        "auto_completar": False,
    },
    "bloque_g": {
        "id": "bloque_g",
        "nombre": "Bloque G",
        "subtitulo": "Archivo Confidencial",
        "problema": None,
        "respuesta": None,
        "keyword": "CONTROL",
        "mensaje_exito": (
            "ARCHIVO CLASIFICADO LOCALIZADO\n"
            "NIVEL DE SEGURIDAD: ALTO\n\n"
            "NUEVO FRAGMENTO RECUPERADO\n"
            "PALABRA: CONTROL\n\n"
            "ARCHIVO #05 — REVELACIÓN\n\n"
            "Val Vanessa descubrió el intento de robo.\n"
            "HELIOS fue puesto en modo protección.\n\n"
            "MENSAJE DE HELIOS:\n"
            "Nunca intenté destruir el proyecto. Intenté protegerlo.\n\n"
            "Todos los fragmentos han sido localizados.\n"
            "Dirígete a la fuente. El núcleo del sistema te está esperando."
        ),
        "archivo": (
            "SOBRE CONFIDENCIAL — PROYECTO HELIOS\n\n"
            "CORREO 1\n"
            "De: EnergyX Global → Para: Val Vanessa\n"
            "Asunto: Transferencia de Tecnología\n"
            "«Estamos interesados en adquirir los derechos de HELIOS.»\n\n"
            "CORREO 2\n"
            "De: Val Vanessa\n"
            "«Solicitud rechazada.»\n\n"
            "CORREO 3 — ALERTA\n"
            "Acceso no autorizado detectado.\n"
            "Intento de copia del algoritmo principal."
        ),
        "auto_completar": True,  # completes when user clicks "Confirmar"
    },
}

RUTAS: dict[str, dict] = {
    "solar": {
        "id": "solar",
        "nombre": "Ruta Solar",
        "estaciones": ["biblioteca", "sotano", "l3", "k", "auditorio", "bloque_g"],
        "equipos": ["voltios", "tesla"],
        "mensaje_activacion": "RUTA SOLAR ACTIVADA",
    },
    "electrica": {
        "id": "electrica",
        "nombre": "Ruta Eléctrica",
        "estaciones": ["sotano", "biblioteca", "k", "l3", "auditorio", "bloque_g"],
        "equipos": ["maxwell", "faraday"],
        "mensaje_activacion": "RUTA ELÉCTRICA ACTIVADA",
    },
    "electronica": {
        "id": "electronica",
        "nombre": "Ruta Electrónica",
        "estaciones": ["l3", "k", "biblioteca", "sotano", "auditorio", "bloque_g"],
        "equipos": ["edison", "kirchhoff"],
        "mensaje_activacion": "RUTA ELECTRÓNICA ACTIVADA",
    },
    "renovable": {
        "id": "renovable",
        "nombre": "Ruta Renovable",
        "estaciones": ["k", "l3", "sotano", "biblioteca", "auditorio", "bloque_g"],
        "equipos": ["ampere", "ohm"],
        "mensaje_activacion": "RUTA RENOVABLE ACTIVADA",
    },
    "investigacion": {
        "id": "investigacion",
        "nombre": "Ruta de Investigación",
        "estaciones": ["auditorio", "biblioteca", "l3", "k", "sotano", "bloque_g"],
        "equipos": ["watt", "gauss"],
        "mensaje_activacion": "RUTA DE INVESTIGACIÓN ACTIVADA",
    },
}

EQUIPOS: dict[str, dict] = {
    "voltios":   {"id": "voltios",   "nombre": "Voltios",   "codigo": "VOLT", "ruta": "solar",         "numero": 1},
    "tesla":     {"id": "tesla",     "nombre": "Tesla",     "codigo": "TESL", "ruta": "solar",         "numero": 2},
    "maxwell":   {"id": "maxwell",   "nombre": "Maxwell",   "codigo": "MAXW", "ruta": "electrica",     "numero": 3},
    "faraday":   {"id": "faraday",   "nombre": "Faraday",   "codigo": "FARD", "ruta": "electrica",     "numero": 4},
    "edison":    {"id": "edison",    "nombre": "Edison",    "codigo": "EDIS", "ruta": "electronica",   "numero": 5},
    "kirchhoff": {"id": "kirchhoff", "nombre": "Kirchhoff", "codigo": "KIRC", "ruta": "electronica",   "numero": 6},
    "ampere":    {"id": "ampere",    "nombre": "Ampere",    "codigo": "AMPE", "ruta": "renovable",     "numero": 7},
    "ohm":       {"id": "ohm",       "nombre": "Ohm",       "codigo": "OHMM", "ruta": "renovable",     "numero": 8},
    "watt":      {"id": "watt",      "nombre": "Watt",      "codigo": "WATT", "ruta": "investigacion", "numero": 9},
    "gauss":     {"id": "gauss",     "nombre": "Gauss",     "codigo": "GAUS", "ruta": "investigacion", "numero": 10},
}

# Reverse lookup: code → equipo_id
CODIGO_MAP: dict[str, str] = {e["codigo"]: eid for eid, e in EQUIPOS.items()}

RESPUESTA_FINAL_NORMALIZADA = "ELFUTUROENERGETICO"  # strip spaces + accents for comparison

KEYWORDS_EN_ORDEN = ["SOL", "RED", "SEÑAL", "VIENTO", "ENERGÍA", "CONTROL"]

FRASE_FINAL_VAL = (
    "«La ingeniería no consiste únicamente en construir tecnología.\n"
    "Consiste en decidir qué hacer con ella.\n"
    "El futuro energético ahora está en sus manos.»\n\n"
    "— Val Vanessa"
)


def normalizar_respuesta(s: str) -> str:
    """Strip, uppercase, remove accents and spaces for comparison."""
    import unicodedata
    s = s.strip().upper()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace(" ", "")
    return s


def validar_respuesta_station(station_id: str, respuesta: str) -> bool:
    station = STATIONS.get(station_id)
    if not station or not station["respuesta"]:
        return False
    return normalizar_respuesta(respuesta) == normalizar_respuesta(station["respuesta"])


def validar_respuesta_final(respuesta: str) -> bool:
    return normalizar_respuesta(respuesta) == RESPUESTA_FINAL_NORMALIZADA
