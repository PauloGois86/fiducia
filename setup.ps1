# Fiducia - Setup PowerShell
# Corre no terminal PowerShell do VS Code: .\setup.ps1

$ErrorActionPreference = "Stop"
Write-Host "`n🚀 A criar estrutura do projeto Fiducia...`n" -ForegroundColor Cyan

# ── Criar todas as pastas primeiro ───────────────────────────────
$pastas = @(
    "backend\app\core",
    "backend\app\models",
    "backend\app\schemas",
    "backend\app\routers",
    "backend\app\services",
    "frontend",
    "docs"
)
foreach ($p in $pastas) {
    New-Item -ItemType Directory -Force -Path $p | Out-Null
}
Write-Host "✅ Pastas criadas" -ForegroundColor Green

# ── docker-compose.yml ───────────────────────────────────────────
Set-Content -Path "docker-compose.yml" -Encoding UTF8 -Value @'
version: "3.9"
services:
  db:
    image: postgres:16
    container_name: fiducia_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - fiducia_pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    container_name: fiducia_backend
    restart: unless-stopped
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      SECRET_KEY: ${SECRET_KEY}
      TELEGRAM_TOKEN: ${TELEGRAM_TOKEN}
      TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - fiducia_uploads:/app/uploads

volumes:
  fiducia_pgdata:
  fiducia_uploads:
'@

# ── .env ─────────────────────────────────────────────────────────
Set-Content -Path ".env" -Encoding UTF8 -Value @'
POSTGRES_USER=fiducia
POSTGRES_PASSWORD=fiducia_pass
POSTGRES_DB=fiducia_db
SECRET_KEY=muda_isto_para_algo_seguro_32chars
TELEGRAM_TOKEN=8653391647:AAGyRpubPzOcI2DAnSh74n2RlTXoRtK01yk
TELEGRAM_CHAT_ID=-5293130941
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASSWORD=app_password_aqui
'@

# ── .gitignore ────────────────────────────────────────────────────
Set-Content -Path ".gitignore" -Encoding UTF8 -Value @'
.env
__pycache__/
*.pyc
*.pyo
.venv/
uploads/
*.egg-info/
.DS_Store
'@

# ── backend\requirements.txt ─────────────────────────────────────
Set-Content -Path "backend\requirements.txt" -Encoding UTF8 -Value @'
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
alembic==1.13.3
psycopg2-binary==2.9.9
pydantic==2.9.2
pydantic-settings==2.5.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
aiosmtplib==3.0.1
httpx==0.27.2
python-telegram-bot==21.6
reportlab==4.2.2
pillow==10.4.0
'@

# ── backend\Dockerfile ───────────────────────────────────────────
Set-Content -Path "backend\Dockerfile" -Encoding UTF8 -Value @'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
'@

# ── __init__.py em todas as pastas ───────────────────────────────
$inits = @(
    "backend\app\__init__.py",
    "backend\app\core\__init__.py",
    "backend\app\models\__init__.py",
    "backend\app\schemas\__init__.py",
    "backend\app\routers\__init__.py",
    "backend\app\services\__init__.py"
)
foreach ($f in $inits) {
    Set-Content -Path $f -Encoding UTF8 -Value ""
}

# ── backend\app\core\config.py ───────────────────────────────────
Set-Content -Path "backend\app\core\config.py" -Encoding UTF8 -Value @'
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    telegram_token: str
    telegram_chat_id: str

    smtp_host: str
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str

    class Config:
        env_file = ".env"

settings = Settings()
'@

# ── backend\app\core\database.py ─────────────────────────────────
Set-Content -Path "backend\app\core\database.py" -Encoding UTF8 -Value @'
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'@

# ── backend\app\models\models.py ─────────────────────────────────
Set-Content -Path "backend\app\models\models.py" -Encoding UTF8 -Value @'
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    Text, DateTime, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class TamanhoEnum(str, enum.Enum):
    XS = "XS"; S = "S"; M = "M"; L = "L"
    XL = "XL"; XXL = "XXL"; XXXL = "XXXL"

class ModoMedidaEnum(str, enum.Enum):
    SIZE_SET = "size_set"
    DIRETO   = "direto"

class EstadoEncomendaEnum(str, enum.Enum):
    RECEBIDA       = "Recebida"
    AGUARDA_TECIDO = "Aguarda Tecido"
    CORTE          = "Corte"
    PRODUCAO       = "Producao"
    PENDENTE       = "Pendente"
    PRONTA         = "Pronta"
    ENVIADA        = "Enviada"

class TipoCorpoEnum(str, enum.Enum):
    MAGRO     = "Magro"
    NORMAL    = "Normal"
    ATLETICO  = "Atletico"
    GORDO     = "Gordo"
    BARRIGUDO = "Barrigudo"

class InclinacaoOmbroEnum(str, enum.Enum):
    NORMAL   = "Normal"
    ESQUERDO = "Esquerdo caido"
    DIREITO  = "Direito caido"
    AMBOS    = "Ambos caidos"

class Loja(Base):
    __tablename__ = "lojas"
    id            = Column(Integer, primary_key=True)
    nome          = Column(String(100), nullable=False)
    email         = Column(String(100), unique=True, nullable=False)
    telefone      = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    ativo         = Column(Boolean, default=True)
    criado_em     = Column(DateTime(timezone=True), server_default=func.now())
    encomendas    = relationship("Encomenda", back_populates="loja")
    clientes      = relationship("Cliente",   back_populates="loja")

class Cliente(Base):
    __tablename__     = "clientes"
    id                = Column(Integer, primary_key=True)
    loja_id           = Column(Integer, ForeignKey("lojas.id"), nullable=False)
    nome              = Column(String(100), nullable=False)
    email             = Column(String(100))
    telefone          = Column(String(20))
    notas             = Column(Text)
    criado_em         = Column(DateTime(timezone=True), server_default=func.now())
    loja              = relationship("Loja",    back_populates="clientes")
    encomendas        = relationship("Encomenda", back_populates="cliente")
    modelos_colarinho = relationship("ModeloColarinhoCliente", back_populates="cliente")

class ModeloColarinhoGlobal(Base):
    __tablename__ = "modelos_colarinho_global"
    id    = Column(Integer, primary_key=True)
    nome  = Column(String(100), nullable=False, unique=True)
    ativo = Column(Boolean, default=True)

class ModeloColarinhoCliente(Base):
    __tablename__ = "modelos_colarinho_cliente"
    id         = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    nome       = Column(String(100), nullable=False)
    notas      = Column(Text)
    cliente    = relationship("Cliente", back_populates="modelos_colarinho")

class TamanhoStandard(Base):
    __tablename__      = "tamanhos_standard"
    id                 = Column(Integer, primary_key=True)
    tamanho            = Column(Enum(TamanhoEnum), nullable=False, unique=True)
    colarinho          = Column(String(10))
    peito              = Column(Float)
    cinta              = Column(Float)
    anca               = Column(Float)
    comprimento_costas = Column(Float)
    comprimento_frente = Column(Float)
    ombro              = Column(Float)
    comprimento_manga  = Column(Float)
    largura_punho      = Column(Float)
    bicep              = Column(Float)

class Encomenda(Base):
    __tablename__ = "encomendas"
    id            = Column(Integer, primary_key=True)
    numero        = Column(Integer, unique=True)
    loja_id       = Column(Integer, ForeignKey("lojas.id"),    nullable=False)
    cliente_id    = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    estado        = Column(Enum(EstadoEncomendaEnum), default=EstadoEncomendaEnum.RECEBIDA)
    data_entrega_prevista = Column(DateTime(timezone=True))
    criado_em     = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), onupdate=func.now())
    modo_medida        = Column(Enum(ModoMedidaEnum), nullable=False)
    tamanho_base       = Column(Enum(TamanhoEnum))
    colarinho          = Column(String(10))
    peito              = Column(Float)
    cinta              = Column(Float)
    anca               = Column(Float)
    comprimento_costas = Column(Float)
    comprimento_frente = Column(Float)
    ombro              = Column(Float)
    comprimento_manga  = Column(Float)
    largura_punho      = Column(Float)
    bicep              = Column(Float)
    aj_peito              = Column(Float, default=0)
    aj_cinta              = Column(Float, default=0)
    aj_anca               = Column(Float, default=0)
    aj_comprimento_costas = Column(Float, default=0)
    aj_comprimento_frente = Column(Float, default=0)
    aj_ombro              = Column(Float, default=0)
    aj_comprimento_manga  = Column(Float, default=0)
    aj_largura_punho      = Column(Float, default=0)
    aj_bicep              = Column(Float, default=0)
    tipo_corpo       = Column(Enum(TipoCorpoEnum))
    inclinacao_ombro = Column(Enum(InclinacaoOmbroEnum))
    ref_tecido                  = Column(String(100))
    pesponto                    = Column(String(100))
    modelo_colarinho_global_id  = Column(Integer, ForeignKey("modelos_colarinho_global.id"))
    modelo_colarinho_cliente_id = Column(Integer, ForeignKey("modelos_colarinho_cliente.id"))
    modelo_punho = Column(String(100))
    macho        = Column(String(100))
    manga        = Column(String(50))
    bolso        = Column(String(100))
    movimento    = Column(String(100))
    interior     = Column(String(100))
    outros       = Column(Text)
    cor_botao    = Column(String(50))
    mono_texto = Column(String(50))
    mono_tipo  = Column(String(50))
    mono_cor   = Column(String(50))
    mono_x     = Column(Float)
    mono_y     = Column(Float)
    mono_local = Column(String(50))
    observacoes = Column(Text)
    anexos      = Column(JSON, default=list)
    loja    = relationship("Loja",    back_populates="encomendas")
    cliente = relationship("Cliente", back_populates="encomendas")
'@

# ── backend\app\models\seed.py ───────────────────────────────────
Set-Content -Path "backend\app\models\seed.py" -Encoding UTF8 -Value @'
from app.core.database import SessionLocal, engine
from app.models.models import Base, TamanhoStandard, TamanhoEnum, ModeloColarinhoGlobal

STANDARD = [
    {"tamanho": TamanhoEnum.XS,   "colarinho": "36",    "peito": 98,  "cinta": 88,  "anca": 94,  "comprimento_costas": 74, "comprimento_frente": 70, "ombro": 40, "comprimento_manga": 63, "largura_punho": 23, "bicep": 32.6},
    {"tamanho": TamanhoEnum.S,    "colarinho": "37/38", "peito": 104, "cinta": 94,  "anca": 100, "comprimento_costas": 76, "comprimento_frente": 72, "ombro": 42, "comprimento_manga": 64, "largura_punho": 24, "bicep": 33.8},
    {"tamanho": TamanhoEnum.M,    "colarinho": "39/40", "peito": 110, "cinta": 100, "anca": 106, "comprimento_costas": 78, "comprimento_frente": 74, "ombro": 44, "comprimento_manga": 65, "largura_punho": 25, "bicep": 35.0},
    {"tamanho": TamanhoEnum.L,    "colarinho": "41/42", "peito": 116, "cinta": 106, "anca": 112, "comprimento_costas": 80, "comprimento_frente": 76, "ombro": 46, "comprimento_manga": 66, "largura_punho": 26, "bicep": 36.2},
    {"tamanho": TamanhoEnum.XL,   "colarinho": "43/44", "peito": 122, "cinta": 112, "anca": 118, "comprimento_costas": 82, "comprimento_frente": 78, "ombro": 48, "comprimento_manga": 67, "largura_punho": 27, "bicep": 37.4},
    {"tamanho": TamanhoEnum.XXL,  "colarinho": "45/46", "peito": 128, "cinta": 118, "anca": 124, "comprimento_costas": 84, "comprimento_frente": 80, "ombro": 50, "comprimento_manga": 68, "largura_punho": 28, "bicep": 38.6},
    {"tamanho": TamanhoEnum.XXXL, "colarinho": "47",    "peito": 134, "cinta": 124, "anca": 130, "comprimento_costas": 86, "comprimento_frente": 82, "ombro": 52, "comprimento_manga": 69, "largura_punho": 29, "bicep": 39.8},
]
COLARINHOS = ["Italiano", "Frances", "Button-Down", "Mao", "Cutaway", "Classico"]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(TamanhoStandard).first():
            for row in STANDARD:
                db.add(TamanhoStandard(**row))
        if not db.query(ModeloColarinhoGlobal).first():
            for nome in COLARINHOS:
                db.add(ModeloColarinhoGlobal(nome=nome))
        db.commit()
        print("Seed concluido com sucesso")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
'@

# ── backend\app\main.py ──────────────────────────────────────────
Set-Content -Path "backend\app\main.py" -Encoding UTF8 -Value @'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fiducia API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Fiducia API"}
'@

Write-Host "`n✅ Todos os ficheiros criados com sucesso!`n" -ForegroundColor Green
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. cd backend"
Write-Host "  2. python -m venv .venv"
Write-Host "  3. .venv\Scripts\Activate.ps1"
Write-Host "  4. pip install -r requirements.txt"
Write-Host "  5. docker compose up -d db"
Write-Host "  6. python -m app.models.seed"
Write-Host "  7. uvicorn app.main:app --reload"
Write-Host "  8. Abre http://localhost:8000/docs`n"