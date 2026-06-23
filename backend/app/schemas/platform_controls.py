from datetime import datetime

from pydantic import BaseModel, Field


class RegistrationStatusResponse(BaseModel):
    enabled: bool


class RegistrationToggleRequest(BaseModel):
    enabled: bool = Field(description="Whether student registration is open")


class RegistrationAdminResponse(BaseModel):
    enabled: bool
    updated_at: datetime

    model_config = {"from_attributes": True}
