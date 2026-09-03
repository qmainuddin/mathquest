import os
from pydantic import BaseModel

class Settings(BaseModel):
    app_name: str = "MathQuest Scoring Service"
    version: str = "rule_v1.0.0"
    port: int = int(os.getenv("PORT", "8005"))
    host: str = os.getenv("HOST", "0.0.0.0")
    internal_service_token: str = os.getenv("INTERNAL_SERVICE_TOKEN", "test-internal-token-secret")

settings = Settings()
