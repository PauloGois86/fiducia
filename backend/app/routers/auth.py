from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import Loja

router = APIRouter(prefix="/auth", tags=["auth"])

class LojaCreate(BaseModel):
    nome: str
    email: str
    telefone: str | None = None
    password: str

class LojaOut(BaseModel):
    id: int
    nome: str
    email: str
    telefone: str | None

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    loja: LojaOut

@router.post("/register", response_model=LojaOut, status_code=201)
def register(data: LojaCreate, db: Session = Depends(get_db)):
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

@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    loja = db.query(Loja).filter(Loja.email == form.username).first()
    if not loja or not verify_password(form.password, loja.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    token = create_access_token({"sub": loja.id})
    return {"access_token": token, "token_type": "bearer", "loja": loja}