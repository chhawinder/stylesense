from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./stylesense.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 1 week

    google_client_id: str = ""
    google_client_secret: str = ""

    gemini_api_key: str = ""
    groq_api_key: str = ""

    redis_url: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"


settings = Settings()
