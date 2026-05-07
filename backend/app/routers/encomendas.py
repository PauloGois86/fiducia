from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_loja
from app.models.models import Encomenda, Cliente, Loja
from app.schemas.encomenda import EncomendaCreate, EncomendaOut, EncomendaListOut, EstadoUpdate
from app.services.notificacoes import notificar_nova_encomenda_dados

router = APIRouter(prefix="/encomendas", tags=["encomendas"])

def get_next_numero(db: Session) -> int:
    last = db.query(Encomenda).order_by(Encomenda.numero.desc()).first()
    return (last.numero + 1) if last else 1

@router.post("/", response_model=EncomendaOut, status_code=201)
async def criar_encomenda(
    data: EncomendaCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    cliente = db.query(Cliente).filter(
        Cliente.id == data.cliente_id,
        Cliente.loja_id == loja.id
    ).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    encomenda = Encomenda(
        numero=get_next_numero(db),
        loja_id=loja.id,
        **data.model_dump()
    )
    db.add(encomenda)
    db.commit()
    db.refresh(encomenda)

    # Extrai todos os dados necessários ANTES de fechar a sessão
    dados = {
        "numero": encomenda.numero,
        "estado": encomenda.estado.value,
        "criado_em": encomenda.criado_em,
        "data_entrega_prevista": encomenda.data_entrega_prevista,
        "loja_nome": loja.nome,
        "cliente_nome": cliente.nome,
        "cliente_email": cliente.email,
        "modo_medida": encomenda.modo_medida.value,
        "tamanho_base": encomenda.tamanho_base.value if encomenda.tamanho_base else None,
        "aj_peito": encomenda.aj_peito,
        "aj_cinta": encomenda.aj_cinta,
        "aj_anca": encomenda.aj_anca,
        "aj_ombro": encomenda.aj_ombro,
        "aj_comprimento_manga": encomenda.aj_comprimento_manga,
        "aj_comprimento_costas": encomenda.aj_comprimento_costas,
        "ref_tecido": encomenda.ref_tecido,
        "manga": encomenda.manga,
        "modelo_punho": encomenda.modelo_punho,
        "cor_botao": encomenda.cor_botao,
        "bolso": encomenda.bolso,
        "mono_texto": encomenda.mono_texto,
        "mono_local": encomenda.mono_local,
        "mono_cor": encomenda.mono_cor,
        "mono_tipo": encomenda.mono_tipo,
        "observacoes": encomenda.observacoes,
    }

    background_tasks.add_task(notificar_nova_encomenda_dados, dados)
    return encomenda

@router.get("/", response_model=List[EncomendaListOut])
def listar_encomendas(
    estado: str = None,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    query = db.query(Encomenda).filter(Encomenda.loja_id == loja.id)
    if estado:
        query = query.filter(Encomenda.estado == estado)
    return query.order_by(Encomenda.criado_em.desc()).all()

@router.get("/{encomenda_id}", response_model=EncomendaOut)
def detalhe_encomenda(
    encomenda_id: int,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    encomenda = db.query(Encomenda).filter(
        Encomenda.id == encomenda_id,
        Encomenda.loja_id == loja.id
    ).first()
    if not encomenda:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    return encomenda

@router.patch("/{encomenda_id}/estado", response_model=EncomendaOut)
def atualizar_estado(
    encomenda_id: int,
    data: EstadoUpdate,
    db: Session = Depends(get_db),
    loja: Loja = Depends(get_current_loja)
):
    encomenda = db.query(Encomenda).filter(
        Encomenda.id == encomenda_id,
        Encomenda.loja_id == loja.id
    ).first()
    if not encomenda:
        raise HTTPException(status_code=404, detail="Encomenda não encontrada")
    encomenda.estado = data.estado
    db.commit()
    db.refresh(encomenda)
    return encomenda