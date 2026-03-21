"""Settings loaded from environment variables."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/neondb"
    admin_secret: str = "change-me"
    partner_api_url: str = "http://localhost:8003"
    dev_mode: bool = False
    cors_origins: str = ""
    session_ttl: int = 60 * 60 * 24 * 30  # 30 days
    debug: bool = False
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "https://dc-hub.pages.dev/api/auth/callback"
    # Deployment status (Cloud Run, Cloudflare)
    cloudflare_api_token: str = ""
    cloudflare_account_id: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings(
    database_url=os.environ.get("DATABASE_URL", Settings.model_fields["database_url"].default),
    admin_secret=os.environ.get("ADMIN_SECRET", Settings.model_fields["admin_secret"].default),
    partner_api_url=os.environ.get("PARTNER_API_URL", Settings.model_fields["partner_api_url"].default),
    dev_mode=os.environ.get("DEV_MODE", "false").lower() == "true",
    cors_origins=os.environ.get("CORS_ORIGINS", ""),
    debug=os.environ.get("DEBUG", "false").lower() == "true",
    google_client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
    google_client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    google_redirect_uri=os.environ.get("GOOGLE_REDIRECT_URI", Settings.model_fields["google_redirect_uri"].default),
    cloudflare_api_token=os.environ.get("CLOUDFLARE_API_TOKEN", ""),
    cloudflare_account_id=os.environ.get("CLOUDFLARE_ACCOUNT_ID", ""),
)
