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
    is_admin      = Column(Boolean, default=False)  # <- novo
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
