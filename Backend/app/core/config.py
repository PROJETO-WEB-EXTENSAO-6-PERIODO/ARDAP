"""Config via variaveis de ambiente ou .env (FEATURE0002)."""

from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        # um erro de configuracao nao pode mostrar senhas no log
        hide_input_in_errors=True,
    )

    AMBIENTE: Literal["desenvolvimento", "producao"] = "desenvolvimento"

    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "ardap"
    # TLS: exigido pelos bancos na nuvem. DB_SSL_CA so e preciso quando o
    # provedor usa uma autoridade certificadora propria.
    DB_SSL: bool = False
    DB_SSL_CA: str = ""

    # sem valor padrao: com uma chave conhecida, qualquer um forja um login
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # origens do frontend, separadas por virgula
    CORS_ORIGINS: str = "http://localhost:5173"

    # Cloudflare R2. Vazio em desenvolvimento: arquivos em Backend/uploads.
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET: str = ""

    # Bucket separado das copias de seguranca (so os scripts de backup usam)
    BACKUP_R2_ACCESS_KEY_ID: str = ""
    BACKUP_R2_SECRET_ACCESS_KEY: str = ""
    BACKUP_R2_BUCKET: str = ""

    @property
    def em_producao(self) -> bool:
        return self.AMBIENTE == "producao"

    @property
    def origens_cors(self) -> list[str]:
        # o navegador envia a origem sem barra no final
        return [
            o.strip().rstrip("/")
            for o in self.CORS_ORIGINS.split(",")
            if o.strip()
        ]

    @property
    def usa_r2(self) -> bool:
        return bool(self.R2_BUCKET)

    @model_validator(mode="after")
    def _validar(self):
        r2 = {
            "R2_ACCOUNT_ID": self.R2_ACCOUNT_ID,
            "R2_ACCESS_KEY_ID": self.R2_ACCESS_KEY_ID,
            "R2_SECRET_ACCESS_KEY": self.R2_SECRET_ACCESS_KEY,
            "R2_BUCKET": self.R2_BUCKET,
        }
        faltando = [nome for nome, valor in r2.items() if not valor]
        if faltando and (self.em_producao or len(faltando) < len(r2)):
            raise ValueError("Defina tambem: " + ", ".join(faltando))
        if self.em_producao:
            if not self.DB_SSL:
                raise ValueError("DB_SSL deve ser true em producao.")
            if not self.origens_cors or any(
                not o.startswith("https://") for o in self.origens_cors
            ):
                raise ValueError(
                    "CORS_ORIGINS deve ter so enderecos https:// em producao."
                )
        return self


settings = Settings()
