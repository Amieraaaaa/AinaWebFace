from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Supabase
    supabase_url: str
    supabase_anon_key: str = ""
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # Model
    model_mode: str = "demo"  # demo | inference
    model_weights_path: str = "./weights/mobilenetv2_skinai_v1.h5"
    model_version: str = "v1.0.0"

    # Quality gates
    min_quality_score: float = 0.35
    min_face_confidence: float = 0.20
    target_image_size: int = 224

    # API
    api_port: int = 8000
    allowed_origins: str = "http://localhost:3000"
    debug: bool = False

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
