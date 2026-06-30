from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.data.helios import (
    EQUIPOS,
    RUTAS,
    STATIONS,
    validar_respuesta_station,
    validar_respuesta_final,
)
from app.db.models.escape_room import EscapeRoomProgress
from app.db.models.helios_equipo import HeliosEquipo, HeliosEquipoMiembro
from app.db.models.users import RolUsuario, Usuario
from app.schemas.helios import (
    AddHeliosMiembroRequest,
    AdminEquipoSummary,
    AdminHeliosResponse,
    EquipoProgressResponse,
    EstudianteDisponibleResponse,
    HeliosEquipoAdminResponse,
    HeliosEquipoMiembroResponse,
    IniciarResponse,
    StationInfo,
    ValidarFinalResponse,
    ValidarRequest,
    ValidarResponse,
)


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _get_helios_equipo(db: AsyncSession, equipo_id_str: str) -> HeliosEquipo | None:
    try:
        equipo_uuid = uuid.UUID(equipo_id_str)
    except ValueError:
        return None
    result = await db.execute(select(HeliosEquipo).where(HeliosEquipo.id == equipo_uuid))
    return result.scalar_one_or_none()


async def _get_or_create_progress(db: AsyncSession, helios_equipo_id: uuid.UUID) -> EscapeRoomProgress:
    result = await db.execute(
        select(EscapeRoomProgress).where(EscapeRoomProgress.helios_equipo_id == helios_equipo_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        prog = EscapeRoomProgress(helios_equipo_id=helios_equipo_id, estaciones_completadas=[])
        db.add(prog)
        await db.flush()
    return prog


def _build_progress_response(
    equipo: HeliosEquipo,
    prog: EscapeRoomProgress,
    user_id: uuid.UUID | None = None,
) -> EquipoProgressResponse:
    equipo_data = EQUIPOS[equipo.nombre]
    ruta = RUTAS[equipo.ruta]
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

    fragmentos = [STATIONS[sid]["keyword"] for sid in completadas if sid in STATIONS]
    es_lider = user_id is not None and equipo.lider_id == user_id

    return EquipoProgressResponse(
        equipo_id=str(equipo.id),
        nombre=equipo_data["nombre"],
        ruta_id=ruta["id"],
        ruta_nombre=ruta["nombre"],
        numero=equipo_data["numero"],
        es_lider=es_lider,
        estaciones_completadas=completadas,
        fragmentos=fragmentos,
        total_estaciones=len(estaciones_ruta),
        estacion_actual=estacion_actual,
        estacion_actual_index=estacion_index,
        iniciado_en=prog.iniciado_en,
        completado_en=prog.completado_en,
        completado=prog.completado,
    )


def _build_equipo_admin_response(equipo: HeliosEquipo) -> HeliosEquipoAdminResponse:
    equipo_data = EQUIPOS[equipo.nombre]
    ruta = RUTAS[equipo.ruta]
    prog = equipo.progreso
    completadas = list(prog.estaciones_completadas or []) if prog else []
    total = len(ruta["estaciones"])
    porcentaje = int((len(completadas) / total) * 100) if total else 0

    miembros = [
        HeliosEquipoMiembroResponse(
            usuario_id=str(m.usuario_id),
            nombre_completo=m.usuario.nombre_completo,
            email=m.usuario.email,
        )
        for m in equipo.miembros
    ]

    return HeliosEquipoAdminResponse(
        id=str(equipo.id),
        nombre=equipo_data["nombre"],
        nombre_id=equipo.nombre,
        ruta_id=ruta["id"],
        ruta_nombre=ruta["nombre"],
        numero=equipo_data["numero"],
        lider_id=str(equipo.lider_id) if equipo.lider_id else None,
        miembros=miembros,
        iniciado=bool(prog and prog.iniciado_en),
        completado=bool(prog and prog.completado),
        porcentaje=porcentaje,
    )


# ── Student game functions ─────────────────────────────────────────────────────

async def get_my_team(db: AsyncSession, user_id: uuid.UUID) -> EquipoProgressResponse | None:
    result = await db.execute(
        select(HeliosEquipoMiembro)
        .where(HeliosEquipoMiembro.usuario_id == user_id)
        .options(selectinload(HeliosEquipoMiembro.equipo))
    )
    miembro = result.scalar_one_or_none()
    if not miembro:
        return None
    equipo = miembro.equipo
    prog = await _get_or_create_progress(db, equipo.id)
    await db.commit()
    return _build_progress_response(equipo, prog, user_id)


async def get_progress(
    db: AsyncSession, equipo_id_str: str, user_id: uuid.UUID
) -> EquipoProgressResponse | None:
    equipo = await _get_helios_equipo(db, equipo_id_str)
    if not equipo:
        return None
    # verify user is a member
    try:
        equipo_uuid = uuid.UUID(equipo_id_str)
    except ValueError:
        return None
    result = await db.execute(
        select(HeliosEquipoMiembro).where(
            HeliosEquipoMiembro.equipo_id == equipo_uuid,
            HeliosEquipoMiembro.usuario_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        return None
    prog = await _get_or_create_progress(db, equipo.id)
    await db.commit()
    return _build_progress_response(equipo, prog, user_id)


async def iniciar_juego(db: AsyncSession, equipo_id_str: str, user_id: uuid.UUID) -> IniciarResponse:
    equipo = await _get_helios_equipo(db, equipo_id_str)
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    if equipo.lider_id != user_id:
        raise HTTPException(status_code=403, detail="Solo el líder puede iniciar el juego.")
    prog = await _get_or_create_progress(db, equipo.id)
    if not prog.iniciado_en:
        prog.iniciado_en = datetime.now(timezone.utc)
    await db.commit()
    return IniciarResponse(equipo_id=equipo_id_str, iniciado_en=prog.iniciado_en)


async def validar_respuesta(db: AsyncSession, req: ValidarRequest, user_id: uuid.UUID) -> ValidarResponse | None:
    equipo = await _get_helios_equipo(db, req.equipo_id)
    if not equipo:
        return None
    if equipo.lider_id != user_id:
        raise HTTPException(status_code=403, detail="Solo el líder puede validar respuestas.")

    equipo_data = EQUIPOS[equipo.nombre]
    ruta = RUTAS[equipo_data["ruta"]]
    prog = await _get_or_create_progress(db, equipo.id)
    completadas = list(prog.estaciones_completadas or [])

    if req.station_id in completadas:
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


async def confirmar_bloque_g(db: AsyncSession, equipo_id_str: str, user_id: uuid.UUID) -> ValidarResponse | None:
    equipo = await _get_helios_equipo(db, equipo_id_str)
    if not equipo:
        return None
    if equipo.lider_id != user_id:
        raise HTTPException(status_code=403, detail="Solo el líder puede confirmar estaciones.")

    prog = await _get_or_create_progress(db, equipo.id)
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


async def validar_final(
    db: AsyncSession, equipo_id_str: str, respuesta: str, user_id: uuid.UUID
) -> ValidarFinalResponse | None:
    equipo = await _get_helios_equipo(db, equipo_id_str)
    if not equipo:
        return None
    if equipo.lider_id != user_id:
        raise HTTPException(status_code=403, detail="Solo el líder puede validar la misión final.")

    equipo_data = EQUIPOS[equipo.nombre]
    prog = await _get_or_create_progress(db, equipo.id)
    completadas = prog.estaciones_completadas or []
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


# ── Admin game functions ───────────────────────────────────────────────────────

async def get_admin_overview(db: AsyncSession) -> AdminHeliosResponse:
    result = await db.execute(
        select(HeliosEquipo).options(selectinload(HeliosEquipo.progreso))
    )
    equipos = result.scalars().all()

    summaries: list[AdminEquipoSummary] = []
    for equipo in equipos:
        if equipo.nombre not in EQUIPOS:
            continue
        equipo_data = EQUIPOS[equipo.nombre]
        ruta = RUTAS[equipo.ruta]
        prog = equipo.progreso
        completadas = list(prog.estaciones_completadas or []) if prog else []
        total = len(ruta["estaciones"])
        obtenidos = len(completadas)
        completado = prog.completado if prog else False
        iniciado = bool(prog and prog.iniciado_en)
        porcentaje = int((obtenidos / total) * 100) if total else 0

        estacion_actual_nombre = None
        if not completado and obtenidos < total:
            sid = ruta["estaciones"][obtenidos]
            estacion_actual_nombre = STATIONS[sid]["nombre"]

        summaries.append(
            AdminEquipoSummary(
                equipo_id=str(equipo.id),
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

    summaries.sort(key=lambda s: s.numero)
    completados = sum(1 for s in summaries if s.completado)
    en_progreso = sum(1 for s in summaries if s.iniciado and not s.completado)
    sin_iniciar = sum(1 for s in summaries if not s.iniciado)

    return AdminHeliosResponse(
        equipos=summaries,
        completados=completados,
        en_progreso=en_progreso,
        sin_iniciar=sin_iniciar,
    )


async def reset_equipo(db: AsyncSession, equipo_id_str: str) -> bool:
    equipo = await _get_helios_equipo(db, equipo_id_str)
    if not equipo:
        return False
    result = await db.execute(
        select(EscapeRoomProgress).where(EscapeRoomProgress.helios_equipo_id == equipo.id)
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


# ── Admin team management functions ───────────────────────────────────────────

async def list_helios_equipos_admin(db: AsyncSession) -> list[HeliosEquipoAdminResponse]:
    result = await db.execute(
        select(HeliosEquipo).options(
            selectinload(HeliosEquipo.miembros).selectinload(HeliosEquipoMiembro.usuario),
            selectinload(HeliosEquipo.progreso),
        )
    )
    equipos = result.scalars().all()
    responses = [_build_equipo_admin_response(e) for e in equipos if e.nombre in EQUIPOS]
    responses.sort(key=lambda r: r.numero)
    return responses


async def create_helios_equipo(db: AsyncSession, nombre: str) -> HeliosEquipoAdminResponse:
    nombre_lower = nombre.lower()
    if nombre_lower not in EQUIPOS:
        raise HTTPException(
            status_code=400,
            detail=f"Nombre de equipo inválido. Opciones: {', '.join(EQUIPOS.keys())}",
        )
    equipo_data = EQUIPOS[nombre_lower]
    equipo = HeliosEquipo(nombre=nombre_lower, ruta=equipo_data["ruta"])
    db.add(equipo)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Este equipo ya existe.")
    # Reload with relationships
    result = await db.execute(
        select(HeliosEquipo)
        .where(HeliosEquipo.id == equipo.id)
        .options(
            selectinload(HeliosEquipo.miembros).selectinload(HeliosEquipoMiembro.usuario),
            selectinload(HeliosEquipo.progreso),
        )
    )
    equipo = result.scalar_one()
    return _build_equipo_admin_response(equipo)


async def add_helios_miembro(
    db: AsyncSession, equipo_id_str: str, usuario_id_str: str
) -> HeliosEquipoAdminResponse:
    equipo = await _get_helios_equipo(db, equipo_id_str)
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")

    try:
        usuario_uuid = uuid.UUID(usuario_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de usuario inválido.")

    result = await db.execute(
        select(Usuario).where(
            Usuario.id == usuario_uuid,
            Usuario.rol == RolUsuario.ESTUDIANTE,
        )
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado.")

    # Check not already in any helios team
    existing = await db.execute(
        select(HeliosEquipoMiembro).where(HeliosEquipoMiembro.usuario_id == usuario_uuid)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="El estudiante ya pertenece a un equipo Helios.")

    miembro = HeliosEquipoMiembro(equipo_id=equipo.id, usuario_id=usuario_uuid)
    db.add(miembro)

    if equipo.lider_id is None:
        equipo.lider_id = usuario_uuid

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(HeliosEquipo)
        .where(HeliosEquipo.id == equipo.id)
        .options(
            selectinload(HeliosEquipo.miembros).selectinload(HeliosEquipoMiembro.usuario),
            selectinload(HeliosEquipo.progreso),
        )
    )
    equipo = result.scalar_one()
    return _build_equipo_admin_response(equipo)


async def remove_helios_miembro(
    db: AsyncSession, equipo_id_str: str, usuario_id_str: str
) -> None:
    try:
        equipo_uuid = uuid.UUID(equipo_id_str)
        usuario_uuid = uuid.UUID(usuario_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido.")

    result = await db.execute(
        select(HeliosEquipoMiembro).where(
            HeliosEquipoMiembro.equipo_id == equipo_uuid,
            HeliosEquipoMiembro.usuario_id == usuario_uuid,
        )
    )
    miembro = result.scalar_one_or_none()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado en este equipo.")

    # If was leader, clear lider_id
    equipo_result = await db.execute(
        select(HeliosEquipo).where(HeliosEquipo.id == equipo_uuid)
    )
    equipo = equipo_result.scalar_one_or_none()
    if equipo and equipo.lider_id == usuario_uuid:
        equipo.lider_id = None

    await db.delete(miembro)
    await db.commit()


async def set_helios_lider(
    db: AsyncSession, equipo_id_str: str, usuario_id_str: str
) -> None:
    try:
        equipo_uuid = uuid.UUID(equipo_id_str)
        usuario_uuid = uuid.UUID(usuario_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido.")

    equipo_result = await db.execute(
        select(HeliosEquipo).where(HeliosEquipo.id == equipo_uuid)
    )
    equipo = equipo_result.scalar_one_or_none()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")

    # Verify the user is a member
    miembro_result = await db.execute(
        select(HeliosEquipoMiembro).where(
            HeliosEquipoMiembro.equipo_id == equipo_uuid,
            HeliosEquipoMiembro.usuario_id == usuario_uuid,
        )
    )
    if not miembro_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="El usuario no es miembro de este equipo.")

    equipo.lider_id = usuario_uuid
    await db.commit()


async def delete_helios_equipo(db: AsyncSession, equipo_id_str: str) -> None:
    equipo = await _get_helios_equipo(db, equipo_id_str)
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")
    await db.delete(equipo)
    await db.commit()


async def get_estudiantes_disponibles(db: AsyncSession) -> list[EstudianteDisponibleResponse]:
    subquery = select(HeliosEquipoMiembro.usuario_id)
    result = await db.execute(
        select(Usuario)
        .where(
            Usuario.rol == RolUsuario.ESTUDIANTE,
            Usuario.id.not_in(subquery),
        )
        .order_by(Usuario.nombre_completo)
    )
    estudiantes = result.scalars().all()
    return [
        EstudianteDisponibleResponse(
            id=str(e.id),
            nombre_completo=e.nombre_completo,
            email=e.email,
        )
        for e in estudiantes
    ]
