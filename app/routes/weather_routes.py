"""Weather Dashboard API routes with RBAC and input validation."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import get_current_user
from app.models import User
from app.schemas import CurrentWeatherResponse, WeatherForecastResponse
from app.services.weather_service import (
    WeatherServiceError,
    get_current_weather,
    get_weather_forecast,
)

router = APIRouter(prefix="/weather", tags=["Weather Dashboard"])


@router.get("", response_model=CurrentWeatherResponse, include_in_schema=False)
@router.get("/", response_model=CurrentWeatherResponse, include_in_schema=False)
@router.get(
    "/current",
    response_model=CurrentWeatherResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Weather",
    description="Returns current weather metrics including temperature, feels like, condition, humidity, wind speed, precipitation, UV index, visibility, and weather icon."
)
def get_current_weather_endpoint(
    location: Optional[str] = Query(None, description="City or location name to search weather for"),
    lat: Optional[float] = Query(None, description="Optional latitude coordinate"),
    lon: Optional[float] = Query(None, description="Optional longitude coordinate"),
    language_id: Optional[int] = Query(None, description="Optional language ID for multilingual support"),
    current_user: User = Depends(get_current_user),
) -> CurrentWeatherResponse:
    """Fetch current weather for a specified location (Requires authenticated user)."""
    clean_location = location.strip() if (location and location.strip()) else "Hyderabad"

    effective_language_id = language_id
    if effective_language_id is None and current_user and current_user.language_id:
        effective_language_id = current_user.language_id

    try:
        result = get_current_weather(clean_location, effective_language_id)
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
    description="Returns 5-day daily weather forecast with minimum/maximum temperature, condition, day name, and weather icon."
)
def get_weather_forecast_endpoint(
    location: Optional[str] = Query(None, description="City or location name to search weather forecast for"),
    lat: Optional[float] = Query(None, description="Optional latitude coordinate"),
    lon: Optional[float] = Query(None, description="Optional longitude coordinate"),
    language_id: Optional[int] = Query(None, description="Optional language ID for multilingual support"),
    current_user: User = Depends(get_current_user),
) -> WeatherForecastResponse:
    """Fetch 5-day daily forecast for a specified location (Requires authenticated user)."""
    clean_location = location.strip() if (location and location.strip()) else "Hyderabad"

    effective_language_id = language_id
    if effective_language_id is None and current_user and current_user.language_id:
        effective_language_id = current_user.language_id

    try:
        result = get_weather_forecast(clean_location, effective_language_id)
        return WeatherForecastResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except WeatherServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    effective_language_id = language_id
    if effective_language_id is None and current_user and current_user.language_id:
        effective_language_id = current_user.language_id

    try:
        result = get_weather_forecast(location, effective_language_id)
        return WeatherForecastResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except WeatherServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
