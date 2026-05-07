import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const ESTADOS = ['Recebida', 'Aguarda Tecido', 'Corte', 'Producao', 'Pendente', 'Pronta', 'Enviada']

const ESTADO_COR = {
  'Recebida':      'bg-blue-100 text-blue-800',
  'Aguarda Tecido':'bg-yellow-100 text-yellow-800',
  'Corte':         'bg-orange-100 text-orange-800',
  'Producao':      'bg-purple-100 text-purple-800',
  'Pendente':      'bg-red-100 text-red-800',
  'Pronta':        'bg-green-100 text-green-800',
  'Enviada':       'bg-slate-100 text-slate-600',
}

function Campo({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}

function Secao({ titulo, children }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
      </CardContent>
    </Card>
  )
}

export default function DetalheEncomenda() {
  const { id } = useParams()
  const { loja, logout } = useAuth()
  const navigate = useNavigate()
  const [enc, setEnc] = useState(null)
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const endpoint = loja?.is_admin ? `/admin/encomendas/${id}` : `/encomendas/${id}`
    api.get(endpoint).then((r) => {
      setEnc(r.data)
      setEstado(r.data.estado)
    })
  }, [id])

  const guardarEstado = async () => {
    setLoading(true)
    try {
      const { data } = await api.patch(`/encomendas/${id}/estado`, { estado })
      setEnc(data)
      toast.success('Estado actualizado!')
    } catch {
      toast.error('Erro ao actualizar estado')
    } finally {
      setLoading(false)
    }
  }

  if (!enc) return <p className="text-center py-12 text-slate-400">A carregar...</p>

  const ajustes = [
    enc.aj_peito && `Peito: ${enc.aj_peito > 0 ? '+' : ''}${enc.aj_peito}`,
    enc.aj_cinta && `Cinta: ${enc.aj_cinta > 0 ? '+' : ''}${enc.aj_cinta}`,
    enc.aj_anca && `Anca: ${enc.aj_anca > 0 ? '+' : ''}${enc.aj_anca}`,
    enc.aj_ombro && `Ombro: ${enc.aj_ombro > 0 ? '+' : ''}${enc.aj_ombro}`,
    enc.aj_comprimento_manga && `Manga: ${enc.aj_comprimento_manga > 0 ? '+' : ''}${enc.aj_comprimento_manga}`,
    enc.aj_comprimento_costas && `Costas: ${enc.aj_comprimento_costas > 0 ? '+' : ''}${enc.aj_comprimento_costas}`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧵</span>
          <div>
            <h1 className="font-bold text-slate-800">Fiducia Atelier</h1>
            <p className="text-xs text-slate-500">{loja?.nome}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/encomendas')}>← Voltar</Button>
          <Button variant="outline" size="sm" onClick={logout}>Sair</Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Encomenda #{enc.numero}</h2>
            <p className="text-slate-500">{new Date(enc.criado_em).toLocaleDateString('pt-PT', { dateStyle: 'full' })}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${ESTADO_COR[enc.estado] || 'bg-slate-100'}`}>
            {enc.estado}
          </span>
        </div>

        {/* Estado */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🔄 Actualizar Estado</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 items-center">
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={guardarEstado} disabled={loading || estado === enc.estado}>
                {loading ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cliente */}
        <Secao titulo="👤 Cliente">
          <Campo label="Nome" value={enc.cliente?.nome} />
          <Campo label="Email" value={enc.cliente?.email} />
          <Campo label="Telefone" value={enc.cliente?.telefone} />
          {enc.data_entrega_prevista && (
            <Campo label="Entrega prevista"
              value={new Date(enc.data_entrega_prevista).toLocaleDateString('pt-PT')} />
          )}
        </Secao>

        {/* Medidas */}
        <Secao titulo="📐 Medidas">
          <Campo label="Modo" value={enc.modo_medida === 'size_set' ? 'Size Set' : 'Medida Directa'} />
          {enc.tamanho_base && <Campo label="Tamanho base" value={enc.tamanho_base} />}
          {ajustes && <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-slate-400">Ajustes</p>
            <p className="text-sm font-medium text-slate-700">{ajustes}</p>
          </div>}
          <Campo label="Peito" value={enc.peito ? `${enc.peito} cm` : null} />
          <Campo label="Cinta" value={enc.cinta ? `${enc.cinta} cm` : null} />
          <Campo label="Anca" value={enc.anca ? `${enc.anca} cm` : null} />
          <Campo label="Ombro" value={enc.ombro ? `${enc.ombro} cm` : null} />
          <Campo label="Manga" value={enc.comprimento_manga ? `${enc.comprimento_manga} cm` : null} />
          <Campo label="Costas" value={enc.comprimento_costas ? `${enc.comprimento_costas} cm` : null} />
          <Campo label="Punho" value={enc.largura_punho ? `${enc.largura_punho} cm` : null} />
          <Campo label="Bicep" value={enc.bicep ? `${enc.bicep} cm` : null} />
          <Campo label="Tipo corpo" value={enc.tipo_corpo} />
          <Campo label="Inclinação ombro" value={enc.inclinacao_ombro} />
        </Secao>

        {/* Camisa */}
        <Secao titulo="👔 Camisa">
          <Campo label="Ref. Tecido" value={enc.ref_tecido} />
          <Campo label="Manga" value={enc.manga} />
          <Campo label="Modelo Punho" value={enc.modelo_punho} />
          <Campo label="Cor Botão" value={enc.cor_botao} />
          <Campo label="Bolso" value={enc.bolso} />
          <Campo label="Pesponto" value={enc.pesponto} />
          <Campo label="Movimento" value={enc.movimento} />
          <Campo label="Macho" value={enc.macho} />
          <Campo label="Interior" value={enc.interior} />
          <Campo label="Outros" value={enc.outros} />
        </Secao>

        {/* Monograma */}
        {enc.mono_texto && (
          <Secao titulo="🔤 Monograma">
            <Campo label="Texto" value={enc.mono_texto} />
            <Campo label="Tipo" value={enc.mono_tipo} />
            <Campo label="Cor" value={enc.mono_cor} />
            <Campo label="Local" value={enc.mono_local} />
            <Campo label="Posição X" value={enc.mono_x} />
            <Campo label="Posição Y" value={enc.mono_y} />
          </Secao>
        )}

        {/* Observações */}
        {enc.observacoes && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">📝 Observações</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{enc.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}