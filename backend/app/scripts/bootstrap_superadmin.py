import asyncio
import sys

from pydantic import EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import select

from app.core.security import hash_password
from app.db.models.users import RolUsuario, Usuario
from app.db.session import AsyncSessionLocal


class BootstrapSettings(BaseSettings):
    DATABASE_URL: str
    SUPERADMIN_EMAIL: EmailStr
    SUPERADMIN_PASSWORD: str = Field(min_length=8)
    SUPERADMIN_NAME: str = "Super Admin"

    @field_validator("SUPERADMIN_EMAIL", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().rstrip(".")

    @field_validator("SUPERADMIN_NAME")
    @classmethod
    def strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("SUPERADMIN_NAME cannot be empty")
        return value

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


async def bootstrap_superadmin() -> int:
    settings = BootstrapSettings()
    email = str(settings.SUPERADMIN_EMAIL).lower()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Usuario).where(Usuario.email == email))
        existing = result.scalar_one_or_none()

        if existing is not None:
            if existing.rol == RolUsuario.SUPER_ADMIN:
                print(f"Super admin already exists: {email}")
                return 0
            print(f"Error: {email} is already registered with role '{existing.rol.value}'")
            return 1

        result = await db.execute(
            select(Usuario).where(Usuario.rol == RolUsuario.SUPER_ADMIN)
        )
        other_super_admin = result.scalar_one_or_none()
        if other_super_admin is not None:
            print(
                "Error: another super admin already exists "
                f"({other_super_admin.email}). Bootstrap aborted."
            )
            return 1

        db.add(
            Usuario(
                email=email,
                password_hash=hash_password(settings.SUPERADMIN_PASSWORD),
                rol=RolUsuario.SUPER_ADMIN,
                nombre_completo=settings.SUPERADMIN_NAME,
            )
        )
        await db.commit()
        print(f"Super admin created: {email}")
        return 0


def main() -> None:
    exit_code = asyncio.run(bootstrap_superadmin())
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
