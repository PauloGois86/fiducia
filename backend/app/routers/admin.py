from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.dependencies import get_admin
from app.core.security import hash_password
from app.models.models import Loja, Cliente, Encomenda
from app.schemas.encomenda import EncomendaListOut


router = APIRouter(prefix="/admin", tags=["admin"])

# ── Schemas ──────────────────────────────────────────────────────

class LojaCreate(BaseModel):
    nome: str
    email: str
    telefone: Optional[str] = None
    password: str

class LojaUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    password: Optional[str] = None
    ativo: Optional[bool] = None

class LojaOut(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str] = None
    ativo: bool
    is_admin: bool
    model_config = {"from_attributes": True}

class ClienteCreate(BaseModel):
    loja_id: int
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    notas: Optional[str] = None

class ClienteOut(BaseModel):
    id: int
    loja_id: int
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    notas: Optional[str] = None
    model_config = {"from_attributes": True}

# ── Lojas ─────────────────────────────────────────────────────────

@router.get("/lojas", response_model=List[LojaOut])
def listar_lojas(db: Session = Depends(get_db), _=Depends(get_admin)):
    return db.query(Loja).order_by(Loja.nome).all()

@router.post("/lojas", response_model=LojaOut, status_code=201)
def criar_loja(data: LojaCreate, db: Session = Depends(get_db), _=Depends(get_admin)):
    if db.query(Loja).filter(Loja.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email já registado")
    loja = Loja(
        nome=data.nome,
        email=data.email,
        telefone=data.telefone,
        password_hash=hash_password(data.password)
    )
    db.add(loja)
    db.commit()
    db.refresh(loja)
    return loja

@router.patch("/lojas/{loja_id}", response_model=LojaOut)
def actualizar_loja(loja_id: int, data: LojaUpdate, db: Session = Depends(get_db), _=Depends(get_admin)):
    loja = db.query(Loja).filter(Loja.id == loja_id).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    if data.nome:     loja.nome = data.nome
    if data.telefone: loja.telefone = data.telefone
    if data.password: loja.password_hash = hash_password(data.password)
    if data.ativo is not None: loja.ativo = data.ativo
    db.commit()
    db.refresh(loja)
    return loja

# ── Clientes ──────────────────────────────────────────────────────

@router.get("/clientes", response_model=List[ClienteOut])
def listar_todos_clientes(
    loja_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_admin)
):
    query = db.query(Cliente)
    if loja_id:
        query = query.filter(Cliente.loja_id == loja_id)
    return query.order_by(Cliente.nome).all()

@router.post("/clientes", response_model=ClienteOut, status_code=201)
def criar_cliente_admin(data: ClienteCreate, db: Session = Depends(get_db), _=Depends(get_admin)):
    loja = db.query(Loja).filter(Loja.id == data.loja_id).first()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    cliente = Cliente(**data.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente

# ── Encomendas (visão global) ─────────────────────────────────────

@router.get("/encomendas", response_model=List[EncomendaListOut])
def listar_todas_encomendas(
    loja_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_admin)
):
    query = db.query(Encomenda).options(
        joinedload(Encomenda.cliente),
        joinedload(Encomenda.loja)
    )
    if loja_id: query = query.filter(Encomenda.loja_id == loja_id)
    if estado:  query = query.filter(Encomenda.estado == estado)
    return query.order_by(Encomenda.criado_em.desc()).all()
@router.get("/encomendas/{encomenda_id}")
def detalhe_encomenda_admin(
    encomenda_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_admin)
):
    enc = db.query(Encomenda).options(
        joinedload(Encomenda.cliente),
        joinedload(Encomenda.loja)
    ).filter(Encomenda.id == encomenda_id).first()
    if not enc:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return enc