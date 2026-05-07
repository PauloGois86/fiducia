from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models.models import Base, TamanhoStandard, TamanhoEnum, ModeloColarinhoGlobal, Loja, Cliente, Encomenda, ModoMedidaEnum, EstadoEncomendaEnum
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
    {"nome": "Administrador",        "email": "geral.fiducia@gmail.com",   "telefone": "", "password": "admin123", "is_admin": True},
    {"nome": "Loja Cintado Lisboa",  "email": "lisboa@cintado.pt",  "telefone": "211234567", "password": "loja123", "is_admin": False},
    {"nome": "Loja Cintado Porto",   "email": "porto@cintado.pt",   "telefone": "222345678", "password": "loja123", "is_admin": False},
    {"nome": "Loja Cintado Coimbra", "email": "coimbra@cintado.pt", "telefone": "239456789", "password": "loja123", "is_admin": False},
]

CLIENTES_MOCK = [
    # loja_idx, nome, email, telefone
    (0, "António Silva",    "antonio@email.pt",  "912000001"),
    (0, "Bruno Ferreira",   "bruno@email.pt",    "912000002"),
    (1, "Carlos Mendes",    "carlos@email.pt",   "912000003"),
    (1, "António Silva",    "antonio@email.pt",  "912000004"),  # mesmo nome, loja diferente
    (2, "Diana Costa",      "diana@email.pt",    "912000005"),
]

ENCOMENDAS_MOCK = [
    {
        "loja_idx": 1, "cliente_idx": 0,
        "modo_medida": ModoMedidaEnum.SIZE_SET, "tamanho_base": TamanhoEnum.M,
        "aj_peito": -2, "aj_cinta": -4, "aj_comprimento_manga": 1,
        "ref_tecido": "Oxford Branco 100% Algodão", "manga": "Longa",
        "modelo_punho": "Simples", "cor_botao": "Branco",
        "mono_texto": "ASG", "mono_local": "Punho esquerdo", "mono_cor": "Azul Navy",
        "estado": EstadoEncomendaEnum.PRODUCAO,
        "observacoes": "Cliente prefere colarinho com mais altura",
    },
    {
        "loja_idx": 1, "cliente_idx": 1,
        "modo_medida": ModoMedidaEnum.SIZE_SET, "tamanho_base": TamanhoEnum.L,
        "aj_peito": 2, "aj_cinta": 0, "aj_comprimento_manga": 0,
        "ref_tecido": "Twill Azul Marinho", "manga": "Longa",
        "modelo_punho": "Duplo", "cor_botao": "Azul",
        "estado": EstadoEncomendaEnum.RECEBIDA,
        "observacoes": None,
    },
    {
        "loja_idx": 2, "cliente_idx": 2,
        "modo_medida": ModoMedidaEnum.DIRETO,
        "peito": 108.0, "cinta": 96.0, "anca": 104.0, "ombro": 45.0,
        "comprimento_costas": 79.0, "comprimento_frente": 75.0,
        "comprimento_manga": 66.0, "largura_punho": 25.5, "bicep": 36.0,
        "ref_tecido": "Linho Bege", "manga": "Curta",
        "modelo_punho": "Simples", "cor_botao": "Bege",
        "estado": EstadoEncomendaEnum.PRONTA,
        "observacoes": "Urgente — cliente viaja na próxima semana",
    },
    {
        "loja_idx": 2, "cliente_idx": 3,
        "modo_medida": ModoMedidaEnum.SIZE_SET, "tamanho_base": TamanhoEnum.XL,
        "aj_peito": 0, "aj_cinta": -2, "aj_comprimento_manga": 2,
        "ref_tecido": "Popelina Branca", "manga": "Longa",
        "modelo_punho": "Simples", "cor_botao": "Branco",
        "estado": EstadoEncomendaEnum.ENVIADA,
        "observacoes": None,
    },
    {
        "loja_idx": 3, "cliente_idx": 4,
        "modo_medida": ModoMedidaEnum.SIZE_SET, "tamanho_base": TamanhoEnum.S,
        "aj_peito": -2, "aj_cinta": -2, "aj_comprimento_manga": -1,
        "ref_tecido": "Flanela Cinza", "manga": "Longa",
        "modelo_punho": "Duplo", "cor_botao": "Cinza",
        "mono_texto": "DC", "mono_local": "Peito", "mono_cor": "Branco",
        "estado": EstadoEncomendaEnum.AGUARDA_TECIDO,
        "observacoes": None,
    },
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
                    is_admin=l["is_admin"],
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

        # Encomendas mock
                # Encomendas mockprint(f"Encomendas na BD: {db.query(Encomenda).count()}")
        print(f"Lojas criadas: {len(lojas_criadas)}")
        clientes_db = db.query(Cliente).all()
        print(f"Clientes na BD: {len(clientes_db)}")

        if not db.query(Encomenda).first():
            numero = 1
            for e in ENCOMENDAS_MOCK:
                dados = e.copy()
                loja_idx = dados.pop("loja_idx")
                cliente_idx = dados.pop("cliente_idx")
                loja_enc = lojas_criadas[loja_idx]
                clientes_loja = [c for c in clientes_db if c.loja_id == loja_enc.id]
                print(f"  Loja {loja_enc.nome}: {len(clientes_loja)} clientes")
                if not clientes_loja:
                    print(f"  ⚠️ Sem clientes para loja {loja_enc.nome}, a saltar")
                    continue
                cliente_enc = clientes_loja[cliente_idx % len(clientes_loja)]
                enc = Encomenda(
                    numero=numero,
                    loja_id=loja_enc.id,
                    cliente_id=cliente_enc.id,
                    **dados
                )
                db.add(enc)
                numero += 1
            print("✅ Encomendas mock inseridas")

        db.commit()
        print("\n🎉 Seed completo!")
        print("\nLojas criadas:")
        for l in LOJAS_MOCK:
            print(f"  {l['nome']} | {l['email']} | password: {l['password']}")

    finally:
        db.close()

if __name__ == "__main__":
    seed()