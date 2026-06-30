from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.helios import (
    EQUIPOS,
    RUTAS,
    STATIONS,
    CODIGO_MAP,
    KEYWORDS_EN_ORDEN,
    validar_respuesta_station,
    validar_respuesta_final,
)
from app.db.models.escape_room import EscapeRoomProgress
from app.schemas.helios import (
    AdminEquipoSummary,
    AdminHeliosResponse,
    ConfirmarBloqueGRequest,
    EquipoProgressResponse,
    IniciarResponse,
    StationInfo,
    ValidarFinalResponse,
    ValidarRequest,
    ValidarResponse,
)


def _get_equipo_by_codigo(codigo: str) -> dict | None:
    equipo_id = CODIGO_MAP.get(codigo.strip().upper())
    if not equipo_id:
        return None
    return EQUIPOS[equipo_id]


async def _get_or_create_progress(db: AsyncSession, equipo_id: str) -> EscapeRoomProgress:
    result = await db.execute(
        select(EscapeRoomProgress).where(EscapeRoomProgress.equipo_id == equipo_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        prog = EscapeRoomProgress(equipo_id=equipo_id, estaciones_completadas=[])
        db.add(prog)
        await db.flush()
    return prog


def _build_progress_response(equipo_data: dict, prog: EscapeRoomProgress) -> EquipoProgressResponse:
    ruta = RUTAS[equipo_data["ruta"]]
    estaciones_ruta = ruta["estaciones"]
    completadas = prog.estaciones_completadas or []

    # current station = first not yet completed in route order
    estacion_actual = None
    estacion_index = len(completadas)
    if not prog.completado and estacion_index < len(estaciones_ruta):
        s_id = estaciones_ruta[estacion_index]
        s = STATIONS[s_id]
        estacion_actual = StationInfo(
            id=s["id"],
            nombre=s["nombre"],
            subtitulo=s["subtitulo"],
            problema=s.get("problema"),
            archivo=s.get("archivo", ""),
            auto_completar=s.get("auto_completar", False),
        )

    # build fragments in keyword order
    fragmentos = [STATIONS[sid]["keyword"] for sid in completadas if sid in STATIONS]

    return EquipoProgressResponse(
        equipo_id=equipo_data["id"],
        nombre=equipo_data["nombre"],
        ruta_id=ruta["id"],
        ruta_nombre=ruta["nombre"],
        codigo=equipo_data["codigo"],
        numero=equipo_data["numero"],
        estaciones_completadas=completadas,
        fragmentos=fragmentos,
        total_estaciones=len(estaciones_ruta),
        estacion_actual=estacion_actual,
        estacion_actual_index=estacion_index,
        iniciado_en=prog.iniciado_en,
        completado_en=prog.completado_en,
        completado=prog.completado,
    )


async def login_equipo(db: AsyncSession, codigo: str) -> EquipoProgressResponse | None:
    equipo_data = _get_equipo_by_codigo(codigo)
    if not equipo_data:
        return None
    prog = await _get_or_create_progress(db, equipo_data["id"])
    await db.commit()
    return _build_progress_response(equipo_data, prog)


async def get_progress(db: AsyncSession, equipo_id: str) -> EquipoProgressResponse | None:
    if equipo_id not in EQUIPOS:
        return None
    prog = await _get_or_create_progress(db, equipo_id)
    await db.commit()
    return _build_progress_response(EQUIPOS[equipo_id], prog)


async def iniciar_juego(db: AsyncSession, equipo_id: str) -> IniciarResponse | None:
    if equipo_id not in EQUIPOS:
        return None
    prog = await _get_or_create_progress(db, equipo_id)
    if not prog.iniciado_en:
        prog.iniciado_en = datetime.now(timezone.utc)
        await db.commit()
    return IniciarResponse(equipo_id=equipo_id, iniciado_en=prog.iniciado_en)


async def validar_respuesta(db: AsyncSession, req: ValidarRequest) -> ValidarResponse | None:
    equipo_data = EQUIPOS.get(req.equipo_id)
    if not equipo_data:
        return None

    ruta = RUTAS[equipo_data["ruta"]]
    estaciones_ruta = ruta["estaciones"]
    prog = await _get_or_create_progress(db, req.equipo_id)
    completadas = list(prog.estaciones_completadas or [])

    # Validate it's the expected station
    if req.station_id in completadas:
        # already done — return current state
        fragmentos = [STATIONS[sid]["keyword"] for sid in completadas if sid in STATIONS]
        return ValidarResponse(
            correcto=True,
            keyword=STATIONS[req.station_id]["keyword"],
            mensaje="Esta estación ya fue completada.",
            fragmentos=fragmentos,
            estaciones_completadas=completadas,
            completado=prog.completado,
        )

    station = STATIONS.get(req.station_id)
    if not station:
        return None

    correcto = validar_respuesta_station(req.station_id, req.respuesta)
    if not correcto:
        fragmentos = [STATIONS[sid]["keyword"] for sid in completadas if sid in STATIONS]
        return ValidarResponse(
            correcto=False,
            keyword=None,
            mensaje="CÓDIGO INVALIDADO\nVUELVE A INTENTARLO",
            fragmentos=fragmentos,
            estaciones_completadas=completadas,
            completado=False,
        )

    # Mark station as completed
    completadas.append(req.station_id)
    prog.estaciones_completadas = completadas

    fragmentos = [STATIONS[sid]["keyword"] for sid in completadas if sid in STATIONS]
    await db.commit()

    return ValidarResponse(
        correcto=True,
        keyword=station["keyword"],
        mensaje=station["mensaje_exito"],
        fragmentos=fragmentos,
        estaciones_completadas=completadas,
        completado=prog.completado,
    )


async def confirmar_bloque_g(db: AsyncSession, equipo_id: str) -> ValidarResponse | None:
    equipo_data = EQUIPOS.get(equipo_id)
    if not equipo_data:
        return None

    prog = await _get_or_create_progress(db, equipo_id)
    completadas = list(prog.estaciones_completadas or [])
    station = STATIONS["bloque_g"]

    if "bloque_g" not in completadas:
        completadas.append("bloque_g")
        prog.estaciones_completadas = completadas
        await db.commit()

    fragmentos = [STATIONS[sid]["keyword"] for sid in completadas if sid in STATIONS]
    return ValidarResponse(
        correcto=True,
        keyword=station["keyword"],
        mensaje=station["mensaje_exito"],
        fragmentos=fragmentos,
        estaciones_completadas=completadas,
        completado=prog.completado,
    )


async def validar_final(db: AsyncSession, equipo_id: str, respuesta: str) -> ValidarFinalResponse | None:
    equipo_data = EQUIPOS.get(equipo_id)
    if not equipo_data:
        return None

    prog = await _get_or_create_progress(db, equipo_id)
    completadas = prog.estaciones_completadas or []

    # Must have completed all 6 stations
    ruta = RUTAS[equipo_data["ruta"]]
    if len(completadas) < len(ruta["estaciones"]):
        return ValidarFinalResponse(
            correcto=False,
            mensaje="Aún faltan estaciones por completar.",
        )

    correcto = validar_respuesta_final(respuesta)
    if correcto and not prog.completado:
        prog.completado = True
        prog.completado_en = datetime.now(timezone.utc)
        await db.commit()

    return ValidarFinalResponse(
        correcto=correcto,
        mensaje=(
            "RESPUESTA VALIDADA\n\nCANCELANDO TRANSFERENCIA...\nRESTAURANDO SISTEMA...\nMICROED RECUPERADA..."
            if correcto
            else "CÓDIGO INVALIDADO\nVUELVE A INTENTARLO"
        ),
    )


async def get_admin_overview(db: AsyncSession) -> AdminHeliosResponse:
    result = await db.execute(select(EscapeRoomProgress))
    progresses = {p.equipo_id: p for p in result.scalars().all()}

    summaries: list[AdminEquipoSummary] = []
    for equipo_id, equipo_data in sorted(EQUIPOS.items(), key=lambda x: x[1]["numero"]):
        prog = progresses.get(equipo_id)
        completadas = list(prog.estaciones_completadas or []) if prog else []
        ruta = RUTAS[equipo_data["ruta"]]
        total = len(ruta["estaciones"])
        obtenidos = len(completadas)
        completado = prog.completado if prog else False
        iniciado = bool(prog and prog.iniciado_en)
        porcentaje = int((obtenidos / total) * 100) if total else 0

        # current station name
        estacion_actual_nombre = None
        if not completado and obtenidos < total:
            sid = ruta["estaciones"][obtenidos]
            estacion_actual_nombre = STATIONS[sid]["nombre"]

        summaries.append(
            AdminEquipoSummary(
                equipo_id=equipo_id,
                nombre=equipo_data["nombre"],
                ruta_nombre=ruta["nombre"],
                numero=equipo_data["numero"],
                fragmentos_obtenidos=obtenidos,
                total_fragmentos=total,
                completado=completado,
                iniciado=iniciado,
                iniciado_en=prog.iniciado_en if prog else None,
                completado_en=prog.completado_en if prog else None,
                estacion_actual_nombre=estacion_actual_nombre,
                porcentaje=porcentaje,
            )
        )

    completados = sum(1 for s in summaries if s.completado)
    en_progreso = sum(1 for s in summaries if s.iniciado and not s.completado)
    sin_iniciar = sum(1 for s in summaries if not s.iniciado)

    return AdminHeliosResponse(
        equipos=summaries,
        completados=completados,
        en_progreso=en_progreso,
        sin_iniciar=sin_iniciar,
    )


async def reset_equipo(db: AsyncSession, equipo_id: str) -> bool:
    if equipo_id not in EQUIPOS:
        return False
    result = await db.execute(
        select(EscapeRoomProgress).where(EscapeRoomProgress.equipo_id == equipo_id)
    )
    prog = result.scalar_one_or_none()
    if prog:
        prog.estaciones_completadas = []
        prog.iniciado_en = None
        prog.completado_en = None
        prog.completado = False
        await db.commit()
    return True


async def reset_all(db: AsyncSession) -> None:
    result = await db.execute(select(EscapeRoomProgress))
    for prog in result.scalars().all():
        prog.estaciones_completadas = []
        prog.iniciado_en = None
        prog.completado_en = None
        prog.completado = False
    await db.commit()
