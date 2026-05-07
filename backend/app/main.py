from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.database import engine, get_db
from app.models.models import Base, ModeloColarinhoGlobal
from app.routers import auth, encomendas, clientes, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fiducia API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(encomendas.router)
app.include_router(clientes.router)
app.include_router(admin.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "Fiducia API"}

""" @app.get("/debug/token")
def debug_token(authorization: str = Header(None)):
    from app.core.security import decode_token
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        return payload
    except Exception as e:
        return {"error": str(e)} """
    
@app.get("/colarinhos/globais")
def listar_colarinhos_globais(db: Session = Depends(get_db)):
    from app.core.database import get_db as gdb
    return db.query(ModeloColarinhoGlobal).filter(ModeloColarinhoGlobal.ativo == True).all()