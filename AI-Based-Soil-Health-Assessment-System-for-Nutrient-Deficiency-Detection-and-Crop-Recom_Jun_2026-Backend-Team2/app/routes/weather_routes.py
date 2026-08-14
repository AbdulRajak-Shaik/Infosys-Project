"""Weather Dashboard API routes with RBAC and input validation."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.models import User
from app.schemas import CurrentWeatherResponse, WeatherForecastResponse
from app.services.weather_service import (
    WeatherServiceError,
    get_current_weather,
    get_weather_by_coords,
    get_weather_forecast,
    get_forecast_by_coords,
    reverse_geocode,
)

router = APIRouter(prefix="/weather", tags=["Weather Dashboard"])


class ReverseGeocodeResponse(BaseModel):
    """Response schema for the reverse geocode endpoint."""
    label: str
    lat: float
    lon: float


@router.get(
    "/reverse-geocode",
    response_model=ReverseGeocodeResponse,
    status_code=status.HTTP_200_OK,
    summary="Reverse Geocode Coordinates",
    description=(
        "Resolve GPS coordinates to the most specific available "
        "village/town + district + state label. "
        "Uses OpenWeatherMap Geo API (primary) and Nominatim (fallback)."
    ),
)
def reverse_geocode_endpoint(
    lat: float = Query(..., description="Latitude (decimal degrees)", ge=-90, le=90),
    lon: float = Query(..., description="Longitude (decimal degrees)", ge=-180, le=180),
    current_user: User = Depends(get_current_user),
) -> ReverseGeocodeResponse:
    """Reverse geocode GPS coordinates to a human-readable location label."""
    try:
        label = reverse_geocode(lat, lon)
        return ReverseGeocodeResponse(label=label, lat=lat, lon=lon)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Reverse geocoding failed: {exc}",
        ) from exc


@router.get(
    "",
    response_model=CurrentWeatherResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Weather Alias",
    description="Alias route for GET /weather matching frontend expectations."
)
@router.get(
    "/current",
    response_model=CurrentWeatherResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Weather",
    description=(
        "Returns current weather metrics. Accepts either a location name string "
        "or GPS coordinates (lat + lon). Coordinates are more precise and recommended "
        "when available. Supports multilingual output via language_id."
    ),
)
def get_current_weather_endpoint(
    location: Optional[str] = Query(None, description="City or location name"),
    lat: Optional[float] = Query(None, description="Latitude for coordinate-based lookup", ge=-90, le=90),
    lon: Optional[float] = Query(None, description="Longitude for coordinate-based lookup", ge=-180, le=180),
    language_id: Optional[int] = Query(None, description="Optional language ID for multilingual support"),
    current_user: User = Depends(get_current_user),
) -> CurrentWeatherResponse:
    """Fetch current weather. Prefers lat/lon when provided, falls back to location name."""
    effective_language_id = language_id or (current_user.language_id if current_user else None)

    # Validate: need at least one of location or coords
    if location is None and lat is None and lon is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either 'location' (city name) or both 'lat' and 'lon'.",
        )

    has_coords = lat is not None and lon is not None
    has_location = location is not None and bool(location.strip())

    if not has_coords and not has_location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location parameter cannot be empty or coordinates must be complete.",
        )

    try:
        if has_coords:
            result = get_weather_by_coords(lat, lon, effective_language_id)
        else:
            result = get_current_weather(location, effective_language_id)
        return CurrentWeatherResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except WeatherServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get(
    "/forecast",
    response_model=WeatherForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Get 5-Day Weather Forecast",
    description=(
        "Returns 5-day daily weather forecast. Accepts either a location name "
        "or GPS coordinates (lat + lon). Supports multilingual output via language_id."
    ),
)
def get_weather_forecast_endpoint(
    location: Optional[str] = Query(None, description="City or location name"),
    lat: Optional[float] = Query(None, description="Latitude for coordinate-based lookup", ge=-90, le=90),
    lon: Optional[float] = Query(None, description="Longitude for coordinate-based lookup", ge=-180, le=180),
    language_id: Optional[int] = Query(None, description="Optional language ID for multilingual support"),
    current_user: User = Depends(get_current_user),
) -> WeatherForecastResponse:
    """Fetch 5-day forecast. Prefers lat/lon when provided, falls back to location name."""
    effective_language_id = language_id or (current_user.language_id if current_user else None)

    if location is None and lat is None and lon is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either 'location' (city name) or both 'lat' and 'lon'.",
        )

    has_coords = lat is not None and lon is not None
    has_location = location is not None and bool(location.strip())

    if not has_coords and not has_location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location parameter cannot be empty or coordinates must be complete.",
        )

    try:
        if has_coords:
            result = get_forecast_by_coords(lat, lon, effective_language_id)
        else:
            result = get_weather_forecast(location, effective_language_id)
        return WeatherForecastResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except WeatherServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
