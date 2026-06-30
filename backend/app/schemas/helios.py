from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class EquipoLoginRequest(BaseModel):
    codigo: str


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
    codigo: str
    numero: int
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


# ── Admin ──────────────────────────────────────────────────────────────────────

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
