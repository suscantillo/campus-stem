import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.db.models.refresh_tokens import RefreshToken
from app.db.models.users import RolUsuario, Usuario
from app.schemas.auth import AuthResponse, LoginRequest, StudentRegisterRequest, TokenResponse, UserResponse
from app.services.platform_controls_service import PlatformControlsService


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_student(self, data: StudentRegisterRequest) -> AuthResponse:
        controls_service = PlatformControlsService(self.db)
        if not await controls_service.is_registration_enabled():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student registration is currently disabled",
            )

        user = Usuario(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            rol=RolUsuario.ESTUDIANTE,
            nombre_completo=data.nombre_completo,
            colegio=data.colegio,
            grado=data.grado,
            telefono=data.telefono,
        )
        self.db.add(user)

        try:
            await self.db.flush()
        except IntegrityError as exc:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            ) from exc

        tokens = await self._issue_tokens(user)
        await self.db.commit()
        await self.db.refresh(user)
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def login(self, data: LoginRequest) -> AuthResponse:
        result = await self.db.execute(
            select(Usuario).where(Usuario.email == data.email.lower())
        )
        user = result.scalar_one_or_none()

        if user is None or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        tokens = await self._issue_tokens(user)
        await self.db.commit()
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        token_hash = hash_refresh_token(refresh_token)
        now = datetime.now(timezone.utc)

        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored_token = result.scalar_one_or_none()

        if stored_token is None or stored_token.expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        result = await self.db.execute(
            select(Usuario).where(Usuario.id == stored_token.user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        await self.db.delete(stored_token)
        tokens = await self._issue_tokens(user)
        await self.db.commit()
        return tokens

    async def logout(self, refresh_token: str) -> None:
        token_hash = hash_refresh_token(refresh_token)
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored_token = result.scalar_one_or_none()
        if stored_token is not None:
            await self.db.delete(stored_token)
            await self.db.commit()

    async def _issue_tokens(self, user: Usuario) -> TokenResponse:
        access_token = create_access_token(str(user.id))
        refresh_token = generate_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        self.db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=hash_refresh_token(refresh_token),
                expires_at=expires_at,
            )
        )

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
