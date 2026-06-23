import re
import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.db.models.users import RolUsuario

PHONE_PATTERN = re.compile(r"^3\d{9}$")


class StudentRegisterRequest(BaseModel):
    nombre_completo: str = Field(min_length=1, max_length=200)
    colegio: str = Field(min_length=1, max_length=200)
    grado: int = Field(ge=9, le=11)
    email: EmailStr
    telefono: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip().rstrip(".")
        return value

    @field_validator("nombre_completo", "colegio")
    @classmethod
    def strip_and_validate_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("telefono")
    @classmethod
    def validate_telefono(cls, value: str) -> str:
        value = value.strip()
        if not PHONE_PATTERN.match(value):
            raise ValueError("Phone must be a 10-digit Colombian mobile number starting with 3")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip().rstrip(".")
        return value


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    rol: RolUsuario
    nombre_completo: str
    colegio: str | None
    grado: int | None
    telefono: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
