from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_loja
from app.models.models import Cliente, Loja, Encomenda
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteOut
from app.schemas.encomenda import EncomendaListOut

router = APIRouter(prefix="/clientes", tags=["clientes"])

@router.post("/", response_model=ClienteOut, status_code=201)
def criar_cliente(
    data: ClienteCreate,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    cliente = Cliente(loja_id=loja.id, **data.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente

@router.get("/", response_model=List[ClienteOut])
def listar_clientes(
    nome: str = None,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    query = db.query(Cliente).filter(Cliente.loja_id == loja.id)
    if nome:
        query = query.filter(Cliente.nome.ilike(f"%{nome}%"))
    return query.order_by(Cliente.nome).all()

@router.get("/{cliente_id}", response_model=ClienteOut)
def detalhe_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.loja_id == loja.id
    ).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente

@router.patch("/{cliente_id}", response_model=ClienteOut)
def atualizar_cliente(
    cliente_id: int,
    data: ClienteUpdate,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.loja_id == loja.id
    ).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cliente, field, value)
    db.commit()
    db.refresh(cliente)
    return cliente

@router.get("/{cliente_id}/encomendas", response_model=List[EncomendaListOut])
def historico_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id,
        Cliente.loja_id == loja.id
    ).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return db.query(Encomenda).filter(
        Encomenda.cliente_id == cliente_id,
        Encomenda.loja_id == loja.id
    ).order_by(Encomenda.criado_em.desc()).all()