import httpx
import aiosmtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def formatar_mensagem_telegram(d: dict) -> str:
    modo = "Size Set" if d["modo_medida"] == "size_set" else "Medida Directa"
    tamanho = f" ({d['tamanho_base']})" if d.get("tamanho_base") else ""

    linhas = [
        f"🧵 *Nova Encomenda #{d['numero']}*",
        f"",
        f"👤 *Cliente:* {d['cliente_nome']}",
        f"🏪 *Loja:* {d['loja_nome']}",
        f"📅 *Data:* {d['criado_em'].strftime('%d/%m/%Y %H:%M')}",
        f"",
        f"📐 *Medidas:* {modo}{tamanho}",
    ]

    ajustes = []
    if d.get("aj_peito"):          ajustes.append(f"Peito: {d['aj_peito']:+.1f}")
    if d.get("aj_cinta"):          ajustes.append(f"Cinta: {d['aj_cinta']:+.1f}")
    if d.get("aj_anca"):           ajustes.append(f"Anca: {d['aj_anca']:+.1f}")
    if d.get("aj_ombro"):          ajustes.append(f"Ombro: {d['aj_ombro']:+.1f}")
    if d.get("aj_comprimento_manga"):  ajustes.append(f"Manga: {d['aj_comprimento_manga']:+.1f}")
    if d.get("aj_comprimento_costas"): ajustes.append(f"Costas: {d['aj_comprimento_costas']:+.1f}")
    if ajustes:
        linhas.append(f"✂️ *Ajustes:* {', '.join(ajustes)}")

    linhas += ["", "👔 *Camisa:*"]
    if d.get("ref_tecido"):   linhas.append(f"  • Tecido: {d['ref_tecido']}")
    if d.get("manga"):        linhas.append(f"  • Manga: {d['manga']}")
    if d.get("modelo_punho"): linhas.append(f"  • Punho: {d['modelo_punho']}")
    if d.get("cor_botao"):    linhas.append(f"  • Botão: {d['cor_botao']}")
    if d.get("bolso"):        linhas.append(f"  • Bolso: {d['bolso']}")

    if d.get("mono_texto"):
        linhas += ["", f"🔤 *Monograma:* {d['mono_texto']}"]
        if d.get("mono_local"): linhas.append(f"  • Local: {d['mono_local']}")
        if d.get("mono_cor"):   linhas.append(f"  • Cor: {d['mono_cor']}")
        if d.get("mono_tipo"):  linhas.append(f"  • Tipo: {d['mono_tipo']}")

    if d.get("observacoes"):
        linhas += ["", f"📝 *Obs:* {d['observacoes']}"]

    if d.get("data_entrega_prevista"):
        linhas += ["", f"🗓️ *Entrega prevista:* {d['data_entrega_prevista'].strftime('%d/%m/%Y')}"]

    linhas += ["", f"Estado: *{d['estado']}*"]
    return "\n".join(linhas)


async def enviar_telegram(mensagem: str):
    url = f"https://api.telegram.org/bot{settings.telegram_token}/sendMessage"
    payload = {
        "chat_id": settings.telegram_chat_id,
        "text": mensagem,
        "parse_mode": "Markdown"
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()


async def enviar_email(destinatario: str, nome_cliente: str, d: dict):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Confirmação de Encomenda #{d['numero']} — Fiducia Atelier"
    msg["From"] = settings.smtp_user
    msg["To"] = destinatario

    entrega = d['data_entrega_prevista'].strftime('%d/%m/%Y') if d.get("data_entrega_prevista") else "—"
    obs = f"<p><strong>Observações:</strong> {d['observacoes']}</p>" if d.get("observacoes") else ""

    html = f"""
    <html><body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #1a1a2e;">🧵 Fiducia Atelier</h2>
        <p>Caro/a <strong>{nome_cliente}</strong>,</p>
        <p>A sua encomenda foi registada com sucesso.</p>
        <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background:#f4f4f4;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Nº Encomenda</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">#{d['numero']}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Data</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{d['criado_em'].strftime('%d/%m/%Y %H:%M')}</td>
            </tr>
            <tr style="background:#f4f4f4;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Tecido</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{d.get('ref_tecido') or '—'}</td>
            </tr>
            <tr>
                <td style="padding:8px; border:1px solid #ddd;"><strong>Entrega prevista</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{entrega}</td>
            </tr>
            <tr style="background:#f4f4f4;">
                <td style="padding:8px; border:1px solid #ddd;"><strong>Estado</strong></td>
                <td style="padding:8px; border:1px solid #ddd;">{d['estado']}</td>
            </tr>
        </table>
        {obs}
        <p style="color:#888; font-size:12px; margin-top:30px;">Fiducia Atelier — Este é um email automático.</p>
    </body></html>
    """
    msg.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        username=settings.smtp_user,
        password=settings.smtp_password,
        start_tls=True,
    )


async def notificar_nova_encomenda_dados(d: dict):
    mensagem = formatar_mensagem_telegram(d)
    tarefas = [enviar_telegram(mensagem)]
    tarefas.append(enviar_email(settings.smtp_user, "Atelier", d))
    if d.get("cliente_email"):
        tarefas.append(enviar_email(d["cliente_email"], d["cliente_nome"], d))

    resultados = await asyncio.gather(*tarefas, return_exceptions=True)
    for i, r in enumerate(resultados):
        if isinstance(r, Exception):
            print(f"⚠️ Falha na notificação {i}: {r}")
        else:
            print(f"✅ Notificação {i} enviada com sucesso")