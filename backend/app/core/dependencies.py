from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import Loja

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_loja(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Loja:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        loja_id = payload.get("sub")
        if loja_id is None:
            raise credentials_exception
        loja_id = int(loja_id)
    except JWTError:
        raise credentials_exception

    loja = db.query(Loja).filter(Loja.id == loja_id, Loja.ativo == True).first()
    if loja is None:
        raise credentials_exception
    return loja

def get_admin(loja: Loja = Depends(get_current_loja)) -> Loja:
    if not loja.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return loja