from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClienteCreate(BaseModel):
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    notas: Optional[str] = None

class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    notas: Optional[str] = None

class ClienteOut(BaseModel):
    id: int
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    notas: Optional[str] = None
    criado_em: datetime
    model_config = {"from_attributes": True}