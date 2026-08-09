"""Admin dashboard API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas import (
    DashboardSummaryResponse,
    RecentUserResponse,
    UserGrowthResponse,
)
from app.services.admin_dashboard_service import (
    get_dashboard_summary,
    get_recent_users,
    get_user_growth,
)


router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get admin dashboard summary",
    responses={500: {"description": "Dashboard summary could not be retrieved."}},
)
def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummaryResponse:
    """Return aggregate user and prediction metrics for the admin dashboard."""
    try:
        return DashboardSummaryResponse(**get_dashboard_summary(db))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve dashboard summary.",
        ) from exc


@router.get(
    "/user-growth",
    response_model=list[UserGrowthResponse],
    summary="Get monthly user growth",
    responses={500: {"description": "User growth data could not be retrieved."}},
)
def user_growth(db: Session = Depends(get_db)) -> list[UserGrowthResponse]:
    """Return chronological monthly registration totals for dashboard charts."""
    try:
        return [UserGrowthResponse(**item) for item in get_user_growth(db)]
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve user growth data.",
        ) from exc


@router.get(
    "/recent-users",
    response_model=list[RecentUserResponse],
    summary="Get recent dashboard users",
    responses={500: {"description": "Recent users could not be retrieved."}},
)
def recent_users(db: Session = Depends(get_db)) -> list[RecentUserResponse]:
    """Return the five most recently registered users for the admin dashboard."""
    try:
        return [RecentUserResponse(**user) for user in get_recent_users(db)]
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve recent users.",
        ) from exc
