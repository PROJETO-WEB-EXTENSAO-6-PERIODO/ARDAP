"""Sessao MySQL via SQLAlchemy (FEATURE0002)."""

import certifi
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# URL.create escapa caracteres especiais da senha
url = URL.create(
    "mysql+pymysql",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD,
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
    query={"charset": "utf8mb4"},
)

# As datas sao gravadas no horario de Brasilia, seja qual for o do servidor.
connect_args: dict = {"init_command": "SET time_zone = '-03:00'"}
if settings.DB_SSL:
    # com a CA, o PyMySQL confere o certificado e o nome do servidor
    connect_args["ssl"] = {"ca": settings.DB_SSL_CA or certifi.where()}

# pool_recycle: bancos na nuvem encerram conexoes ociosas
engine = create_engine(
    url, connect_args=connect_args, pool_pre_ping=True, pool_recycle=240
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
