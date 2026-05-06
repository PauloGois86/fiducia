from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models.models import Base, TamanhoStandard, TamanhoEnum, ModeloColarinhoGlobal, Loja, Cliente

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

LOJAS_MOCK = [
    {"nome": "Loja Cintado Lisboa",   "email": "lisboa@cintado.pt",  "telefone": "211234567", "password": "loja123"},
    {"nome": "Loja Cintado Porto",    "email": "porto@cintado.pt",   "telefone": "222345678", "password": "loja123"},
    {"nome": "Loja Cintado Coimbra",  "email": "coimbra@cintado.pt", "telefone": "239456789", "password": "loja123"},
]

CLIENTES_MOCK = [
    # loja_idx, nome, email, telefone
    (0, "António Silva",    "antonio@email.pt",  "912000001"),
    (0, "Bruno Ferreira",   "bruno@email.pt",    "912000002"),
    (1, "Carlos Mendes",    "carlos@email.pt",   "912000003"),
    (1, "António Silva",    "antonio@email.pt",  "912000004"),  # mesmo nome, loja diferente
    (2, "Diana Costa",      "diana@email.pt",    "912000005"),
]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Tamanhos standard
        if not db.query(TamanhoStandard).first():
            for row in STANDARD:
                db.add(TamanhoStandard(**row))
            print("✅ Tamanhos standard inseridos")

        # Modelos colarinho globais
        if not db.query(ModeloColarinhoGlobal).first():
            for nome in COLARINHOS:
                db.add(ModeloColarinhoGlobal(nome=nome))
            print("✅ Modelos de colarinho inseridos")

        # Lojas mock
        lojas_criadas = []
        if not db.query(Loja).first():
            for l in LOJAS_MOCK:
                loja = Loja(
                    nome=l["nome"],
                    email=l["email"],
                    telefone=l["telefone"],
                    password_hash=hash_password(l["password"])
                )
                db.add(loja)
                db.flush()
                lojas_criadas.append(loja)
            print("✅ Lojas mock inseridas")
        else:
            lojas_criadas = db.query(Loja).order_by(Loja.id).all()

        # Clientes mock
        if not db.query(Cliente).first():
            for loja_idx, nome, email, telefone in CLIENTES_MOCK:
                cliente = Cliente(
                    loja_id=lojas_criadas[loja_idx].id,
                    nome=nome,
                    email=email,
                    telefone=telefone
                )
                db.add(cliente)
            print("✅ Clientes mock inseridos")

        db.commit()
        print("\n🎉 Seed completo!")
        print("\nLojas criadas:")
        for l in LOJAS_MOCK:
            print(f"  {l['nome']} | {l['email']} | password: {l['password']}")

    finally:
        db.close()

if __name__ == "__main__":
    seed()