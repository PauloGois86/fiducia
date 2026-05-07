from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.models import (
    ModoMedidaEnum, TamanhoEnum, EstadoEncomendaEnum,
    TipoCorpoEnum, InclinacaoOmbroEnum
)

class MedidasBase(BaseModel):
    modo_medida: ModoMedidaEnum
    tamanho_base: Optional[TamanhoEnum] = None
    colarinho: Optional[str] = None
    peito: Optional[float] = None
    cinta: Optional[float] = None
    anca: Optional[float] = None
    comprimento_costas: Optional[float] = None
    comprimento_frente: Optional[float] = None
    ombro: Optional[float] = None
    comprimento_manga: Optional[float] = None
    largura_punho: Optional[float] = None
    bicep: Optional[float] = None
    # Ajustes (só para size_set)
    aj_peito: float = 0
    aj_cinta: float = 0
    aj_anca: float = 0
    aj_comprimento_costas: float = 0
    aj_comprimento_frente: float = 0
    aj_ombro: float = 0
    aj_comprimento_manga: float = 0
    aj_largura_punho: float = 0
    aj_bicep: float = 0

class CamisaBase(BaseModel):
    ref_tecido: Optional[str] = None
    pesponto: Optional[str] = None
    modelo_colarinho_global_id: Optional[int] = None
    modelo_colarinho_cliente_id: Optional[int] = None
    modelo_punho: Optional[str] = None
    macho: Optional[str] = None
    manga: Optional[str] = None
    bolso: Optional[str] = None
    movimento: Optional[str] = None
    interior: Optional[str] = None
    outros: Optional[str] = None
    cor_botao: Optional[str] = None

class MonogramaBase(BaseModel):
    mono_texto: Optional[str] = None
    mono_tipo: Optional[str] = None
    mono_cor: Optional[str] = None
    mono_x: Optional[float] = None
    mono_y: Optional[float] = None
    mono_local: Optional[str] = None

class EncomendaCreate(MedidasBase, CamisaBase, MonogramaBase):
    cliente_id: int
    tipo_corpo: Optional[TipoCorpoEnum] = None
    inclinacao_ombro: Optional[InclinacaoOmbroEnum] = None
    data_entrega_prevista: Optional[datetime] = None
    observacoes: Optional[str] = None

class EstadoUpdate(BaseModel):
    estado: EstadoEncomendaEnum

class ClienteOut(BaseModel):
    id: int
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    model_config = {"from_attributes": True}

class EncomendaOut(BaseModel):
    id: int
    numero: int
    estado: EstadoEncomendaEnum
    cliente: ClienteOut
    modo_medida: ModoMedidaEnum
    tamanho_base: Optional[TamanhoEnum] = None
    peito: Optional[float] = None
    cinta: Optional[float] = None
    anca: Optional[float] = None
    comprimento_costas: Optional[float] = None
    comprimento_frente: Optional[float] = None
    ombro: Optional[float] = None
    comprimento_manga: Optional[float] = None
    largura_punho: Optional[float] = None
    bicep: Optional[float] = None
    aj_peito: float = 0
    aj_cinta: float = 0
    aj_anca: float = 0
    aj_comprimento_costas: float = 0
    aj_comprimento_frente: float = 0
    aj_ombro: float = 0
    aj_comprimento_manga: float = 0
    aj_largura_punho: float = 0
    aj_bicep: float = 0
    ref_tecido: Optional[str] = None
    modelo_punho: Optional[str] = None
    manga: Optional[str] = None
    cor_botao: Optional[str] = None
    mono_texto: Optional[str] = None
    mono_local: Optional[str] = None
    observacoes: Optional[str] = None
    criado_em: datetime
    data_entrega_prevista: Optional[datetime] = None
    model_config = {"from_attributes": True}

class EncomendaListOut(BaseModel):
    id: int
    numero: int
    estado: EstadoEncomendaEnum
    cliente: ClienteOut
    ref_tecido: Optional[str] = None
    criado_em: datetime
    data_entrega_prevista: Optional[datetime] = None
    model_config = {"from_attributes": True}