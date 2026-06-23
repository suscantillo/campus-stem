from fastapi import APIRouter
from app.api.v1.routes import auth, health, registration
from app.api.v1.routes.admin import registration as admin_registration
from app.api.v1.routes.admin import students as admin_students
from app.api.v1.routes.admin import teams as admin_teams
from app.api.v1.routes.admin import users as admin_users

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(registration.router, tags=["registration"])
api_router.include_router(admin_registration.router, tags=["admin"])
api_router.include_router(admin_users.router, tags=["admin"])
api_router.include_router(admin_students.router, tags=["admin"])
api_router.include_router(admin_teams.router, tags=["admin"])
