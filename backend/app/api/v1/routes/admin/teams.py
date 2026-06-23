from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_roles
from app.db.models.users import RolUsuario, Usuario
from app.db.session import get_db
from app.schemas.teams import (
    CreateTeamRequest,
    GenerateTeamsRequest,
    GenerateTeamsResponse,
    TeamListItem,
    TeamListResponse,
    UpdateTeamRequest,
)
from app.services.teams_service import TeamsService

router = APIRouter(prefix="/admin/teams")


@router.get("", response_model=TeamListResponse)
async def list_teams(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = TeamsService(db)
    return await service.list_teams()


@router.post("", response_model=TeamListItem, status_code=status.HTTP_201_CREATED)
async def create_team(
    data: CreateTeamRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = TeamsService(db)
    return await service.create_team(data)


@router.post("/generate", response_model=GenerateTeamsResponse)
async def generate_teams(
    data: GenerateTeamsRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = TeamsService(db)
    return await service.generate_teams(data.team_size, data.leader_assignment)


@router.patch("/{team_id}", response_model=TeamListItem)
async def update_team(
    team_id: UUID,
    data: UpdateTeamRequest,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = TeamsService(db)
    return await service.update_team(team_id, data)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_roles(RolUsuario.ADMIN)),
):
    service = TeamsService(db)
    await service.delete_team(team_id)
