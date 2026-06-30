from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


# ── Game schemas (student endpoints) ──────────────────────────────────────────

class StationInfo(BaseModel):
    id: str
    nombre: str
    subtitulo: str
    problema: str | None
    archivo: str
    auto_completar: bool


class EquipoProgressResponse(BaseModel):
    equipo_id: str
    nombre: str
    ruta_id: str
    ruta_nombre: str
    numero: int
    es_lider: bool
    estaciones_completadas: list[str]
    fragmentos: list[str]
    total_estaciones: int
    estacion_actual: StationInfo | None
    estacion_actual_index: int
    iniciado_en: datetime | None
    completado_en: datetime | None
    completado: bool


class ValidarRequest(BaseModel):
    equipo_id: str
    station_id: str
    respuesta: str


class ValidarResponse(BaseModel):
    correcto: bool
    keyword: str | None
    mensaje: str
    fragmentos: list[str]
    estaciones_completadas: list[str]
    completado: bool


class IniciarResponse(BaseModel):
    equipo_id: str
    iniciado_en: datetime


class ConfirmarBloqueGRequest(BaseModel):
    equipo_id: str


class ValidarFinalRequest(BaseModel):
    equipo_id: str
    respuesta: str


class ValidarFinalResponse(BaseModel):
    correcto: bool
    mensaje: str


# ── Admin game schemas ─────────────────────────────────────────────────────────

class AdminEquipoSummary(BaseModel):
    equipo_id: str
    nombre: str
    ruta_nombre: str
    numero: int
    fragmentos_obtenidos: int
    total_fragmentos: int
    completado: bool
    iniciado: bool
    iniciado_en: datetime | None
    completado_en: datetime | None
    estacion_actual_nombre: str | None
    porcentaje: int


class AdminHeliosResponse(BaseModel):
    equipos: list[AdminEquipoSummary]
    completados: int
    en_progreso: int
    sin_iniciar: int


# ── Admin team management schemas ─────────────────────────────────────────────

class HeliosEquipoMiembroResponse(BaseModel):
    usuario_id: str
    nombre_completo: str
    email: str


class HeliosEquipoAdminResponse(BaseModel):
    id: str
    nombre: str
    nombre_id: str
    ruta_id: str
    ruta_nombre: str
    numero: int
    lider_id: str | None
    miembros: list[HeliosEquipoMiembroResponse]
    iniciado: bool
    completado: bool
    porcentaje: int


class CreateHeliosEquipoRequest(BaseModel):
    nombre: str


class AddHeliosMiembroRequest(BaseModel):
    usuario_id: str


class SetHeliosLiderRequest(BaseModel):
    usuario_id: str


class EstudianteDisponibleResponse(BaseModel):
    id: str
    nombre_completo: str
    email: str
