import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class LeaderAssignment(str, Enum):
    NONE = "none"
    RANDOM = "random"
    FIRST = "first"


class TeamMemberItem(BaseModel):
    id: uuid.UUID
    nombre_completo: str
    colegio: str | None
    is_lider: bool = False

    model_config = {"from_attributes": True}


class TeamListItem(BaseModel):
    id: uuid.UUID
    nombre: str
    colegio_label: str
    member_count: int
    lider_id: uuid.UUID | None
    lider_nombre: str | None
    miembros: list[TeamMemberItem]
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamListResponse(BaseModel):
    items: list[TeamListItem]
    total: int


class CreateTeamRequest(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=120)


class UpdateTeamRequest(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=120)
    lider_id: uuid.UUID | None = None


class GenerateTeamsRequest(BaseModel):
    team_size: int = Field(default=4, ge=2, le=20)
    leader_assignment: LeaderAssignment = LeaderAssignment.RANDOM


class GenerateTeamsResponse(BaseModel):
    items: list[TeamListItem]
    total: int
    students_assigned: int


class AssignStudentEquipoRequest(BaseModel):
    equipo_id: uuid.UUID | None = None
