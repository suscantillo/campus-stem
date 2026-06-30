from enum import Enum

from pydantic import BaseModel, EmailStr, Field, field_validator


class PrivilegedRole(str, Enum):
    ADMIN = "admin"
    JUEZ = "juez"


class CreatePrivilegedUserRequest(BaseModel):
    nombre_completo: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    rol: PrivilegedRole

    @field_validator("nombre_completo")
    @classmethod
    def strip_and_validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value


class UpdatePrivilegedUserRequest(BaseModel):
    nombre_completo: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class PrivilegedUserResponse(BaseModel):
    id: str
    email: EmailStr
    rol: PrivilegedRole
    nombre_completo: str

    model_config = {"from_attributes": True}
