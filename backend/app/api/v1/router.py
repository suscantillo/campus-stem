from fastapi import APIRouter
from app.api.v1.routes import auth, calificacion, health, helios, marketplace, registration, student_team
from app.api.v1.routes.admin import calificacion as admin_calificacion
from app.api.v1.routes.admin import helios as admin_helios
from app.api.v1.routes.admin import marketplace as admin_marketplace
from app.api.v1.routes.admin import registration as admin_registration
from app.api.v1.routes.admin import students as admin_students
from app.api.v1.routes.admin import teams as admin_teams
from app.api.v1.routes.admin import users as admin_users

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(registration.router, tags=["registration"])
api_router.include_router(marketplace.router, tags=["marketplace"])
api_router.include_router(calificacion.router, tags=["calificacion"])
api_router.include_router(helios.router, tags=["helios"])
api_router.include_router(student_team.router, tags=["student"])
api_router.include_router(admin_registration.router, tags=["admin"])
api_router.include_router(admin_users.router, tags=["admin"])
api_router.include_router(admin_students.router, tags=["admin"])
api_router.include_router(admin_teams.router, tags=["admin"])
api_router.include_router(admin_marketplace.router, tags=["admin"])
api_router.include_router(admin_calificacion.router, tags=["admin"])
api_router.include_router(admin_helios.router, tags=["admin"])
