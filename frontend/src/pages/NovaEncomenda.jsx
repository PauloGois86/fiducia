import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const TAMANHOS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const MANGAS = ['Longa', 'Curta']
const TIPOS_CORPO = ['Magro', 'Normal', 'Atletico', 'Gordo', 'Barrigudo']
const INCLINACOES = ['Normal', 'Esquerdo caido', 'Direito caido', 'Ambos caidos']

const AJUSTE_STEPS = [-4, -3, -2, -1, 0, 1, 2, 3, 4]

function AjusteSelector({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-500">{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AJUSTE_STEPS.map((s) => (
            <SelectItem key={s} value={String(s)}>
              {s > 0 ? `+${s}` : s} cm
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function NovaEncomenda() {
  const { loja, logout } = useAuth()
  const navigate = useNavigate()

  const [clientes, setClientes] = useState([])
  const [colarinhosGlobais, setColarinhosGlobais] = useState([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [clienteId, setClienteId] = useState('')
  const [novoCliente, setNovoCliente] = useState({ nome: '', email: '', telefone: '' })
  const [criarCliente, setCriarCliente] = useState(false)
  const [modoMedida, setModoMedida] = useState('size_set')
  const [tamanhoBase, setTamanhoBase] = useState('M')
  const [ajustes, setAjustes] = useState({
    aj_peito: 0, aj_cinta: 0, aj_anca: 0, aj_ombro: 0,
    aj_comprimento_manga: 0, aj_comprimento_costas: 0,
    aj_comprimento_frente: 0, aj_largura_punho: 0, aj_bicep: 0
  })
  const [medidasDiretas, setMedidasDiretas] = useState({
    colarinho: '', peito: '', cinta: '', anca: '', ombro: '',
    comprimento_costas: '', comprimento_frente: '',
    comprimento_manga: '', largura_punho: '', bicep: ''
  })
  const [tipoCorpo, setTipoCorpo] = useState('')
  const [inclinacaoOmbro, setInclinacaoOmbro] = useState('')
  const [camisa, setCamisa] = useState({
    ref_tecido: '', modelo_colarinho_global_id: '',
    modelo_punho: '', macho: '', manga: 'Longa',
    bolso: '', movimento: '', interior: '', outros: '', cor_botao: '', pesponto: ''
  })
  const [monograma, setMonograma] = useState({
    mono_texto: '', mono_tipo: '', mono_cor: '', mono_local: '', mono_x: '', mono_y: ''
  })
  const [dataEntrega, setDataEntrega] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    api.get('/clientes/').then((r) => setClientes(r.data))
    api.get('/colarinhos/globais').then((r) => setColarinhosGlobais(r.data)).catch(() => { })
  }, [])

  const setAjuste = (key, val) => setAjustes((prev) => ({ ...prev, [key]: val }))
  const setMedida = (key, val) => setMedidasDiretas((prev) => ({ ...prev, [key]: val }))
  const setCamisaField = (key, val) => setCamisa((prev) => ({ ...prev, [key]: val }))
  const setMonogramaField = (key, val) => setMonograma((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let cId = clienteId
      if (criarCliente) {
        const { data } = await api.post('/clientes/', novoCliente)
        cId = data.id
        setClientes((prev) => [...prev, data])
      }
      if (!cId) { toast.error('Selecciona ou cria um cliente'); setLoading(false); return }

      const payload = {
        cliente_id: Number(cId),
        modo_medida: modoMedida,
        ...(modoMedida === 'size_set'
          ? { tamanho_base: tamanhoBase, ...ajustes }
          : Object.fromEntries(
            Object.entries(medidasDiretas)
              .filter(([, v]) => v !== '')
              .map(([k, v]) => [k, Number(v)])
          )
        ),
        tipo_corpo: tipoCorpo || undefined,
        inclinacao_ombro: inclinacaoOmbro || undefined,
        ...Object.fromEntries(Object.entries(camisa).filter(([, v]) => v !== '')),
        modelo_colarinho_global_id: camisa.modelo_colarinho_global_id
          ? Number(camisa.modelo_colarinho_global_id) : undefined,
        ...Object.fromEntries(Object.entries(monograma).filter(([, v]) => v !== '')),
        data_entrega_prevista: dataEntrega || undefined,
        observacoes: observacoes || undefined,
      }

      await api.post('/encomendas/', payload)
      toast.success('Encomenda registada com sucesso!')
      navigate('/encomendas')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao registar encomenda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧵</span>
          <div>
            <h1 className="font-bold text-slate-800">Fiducia Atelier</h1>
            <p className="text-xs text-slate-500">{loja?.nome}</p>
          </div>
          {loja?.is_admin && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>Admin</Button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={logout}>Sair</Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Nova Encomenda</h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* CLIENTE */}
          <Card>
            <CardHeader><CardTitle className="text-base">👤 Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-center">
                <button type="button"
                  className={`px-3 py-1 rounded text-sm border ${!criarCliente ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
                  onClick={() => setCriarCliente(false)}>Cliente existente</button>
                <button type="button"
                  className={`px-3 py-1 rounded text-sm border ${criarCliente ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
                  onClick={() => setCriarCliente(true)}>Novo cliente</button>
              </div>
              {!criarCliente ? (
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona um cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome} {c.telefone ? `· ${c.telefone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Nome *</Label>
                    <Input placeholder="Nome completo"
                      value={novoCliente.nome}
                      onChange={(e) => setNovoCliente((p) => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input placeholder="email@exemplo.pt"
                      value={novoCliente.email}
                      onChange={(e) => setNovoCliente((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input placeholder="9XXXXXXXX"
                      value={novoCliente.telefone}
                      onChange={(e) => setNovoCliente((p) => ({ ...p, telefone: e.target.value }))} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MEDIDAS */}
          <Card>
            <CardHeader><CardTitle className="text-base">📐 Medidas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <button type="button"
                  className={`px-3 py-1 rounded text-sm border ${modoMedida === 'size_set' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
                  onClick={() => setModoMedida('size_set')}>Size Set</button>
                <button type="button"
                  className={`px-3 py-1 rounded text-sm border ${modoMedida === 'direto' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}
                  onClick={() => setModoMedida('direto')}>Medida Directa</button>
              </div>

              {modoMedida === 'size_set' ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label>Tamanho base</Label>
                    <Select value={tamanhoBase} onValueChange={setTamanhoBase}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAMANHOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-3">Ajustes (cm)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <AjusteSelector label="Peito" value={ajustes.aj_peito} onChange={(v) => setAjuste('aj_peito', v)} />
                      <AjusteSelector label="Cinta" value={ajustes.aj_cinta} onChange={(v) => setAjuste('aj_cinta', v)} />
                      <AjusteSelector label="Anca" value={ajustes.aj_anca} onChange={(v) => setAjuste('aj_anca', v)} />
                      <AjusteSelector label="Ombro" value={ajustes.aj_ombro} onChange={(v) => setAjuste('aj_ombro', v)} />
                      <AjusteSelector label="Manga" value={ajustes.aj_comprimento_manga} onChange={(v) => setAjuste('aj_comprimento_manga', v)} />
                      <AjusteSelector label="Costas" value={ajustes.aj_comprimento_costas} onChange={(v) => setAjuste('aj_comprimento_costas', v)} />
                      <AjusteSelector label="Frente" value={ajustes.aj_comprimento_frente} onChange={(v) => setAjuste('aj_comprimento_frente', v)} />
                      <AjusteSelector label="Punho" value={ajustes.aj_largura_punho} onChange={(v) => setAjuste('aj_largura_punho', v)} />
                      <AjusteSelector label="Bicep" value={ajustes.aj_bicep} onChange={(v) => setAjuste('aj_bicep', v)} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(medidasDiretas).map((k) => (
                    <div key={k} className="space-y-1">
                      <Label className="text-xs capitalize">{k.replace(/_/g, ' ')}</Label>
                      <Input type="number" step="0.1" placeholder="cm"
                        value={medidasDiretas[k]}
                        onChange={(e) => setMedida(k, e.target.value)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Morfologia */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Tipo de corpo</Label>
                  <Select value={tipoCorpo} onValueChange={setTipoCorpo}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_CORPO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Inclinação ombro</Label>
                  <Select value={inclinacaoOmbro} onValueChange={setInclinacaoOmbro}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {INCLINACOES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CAMISA */}
          <Card>
            <CardHeader><CardTitle className="text-base">👔 Dados da Camisa</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Ref. Tecido</Label>
                  <Input placeholder="ex: Oxford Branco 100% Algodão"
                    value={camisa.ref_tecido} onChange={(e) => setCamisaField('ref_tecido', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Modelo Colarinho</Label>
                  <Select value={camisa.modelo_colarinho_global_id} onValueChange={(v) => setCamisaField('modelo_colarinho_global_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      {colarinhosGlobais.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Modelo Punho</Label>
                  <Input placeholder="ex: Simples, Duplo..."
                    value={camisa.modelo_punho} onChange={(e) => setCamisaField('modelo_punho', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Manga</Label>
                  <Select value={camisa.manga} onValueChange={(v) => setCamisaField('manga', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MANGAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Cor Botão</Label>
                  <Input placeholder="ex: Branco, Azul..."
                    value={camisa.cor_botao} onChange={(e) => setCamisaField('cor_botao', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Bolso</Label>
                  <Input placeholder="ex: Sem bolso, Bolso simples..."
                    value={camisa.bolso} onChange={(e) => setCamisaField('bolso', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Pesponto</Label>
                  <Input placeholder="ex: Simples, Duplo..."
                    value={camisa.pesponto} onChange={(e) => setCamisaField('pesponto', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Movimento</Label>
                  <Input placeholder="ex: Com movimento..."
                    value={camisa.movimento} onChange={(e) => setCamisaField('movimento', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Macho</Label>
                  <Input placeholder="ex: Com macho..."
                    value={camisa.macho} onChange={(e) => setCamisaField('macho', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Interior</Label>
                  <Input placeholder="ex: Com interior..."
                    value={camisa.interior} onChange={(e) => setCamisaField('interior', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1 mt-3">
                <Label>Outros</Label>
                <Input placeholder="Outras especificações..."
                  value={camisa.outros} onChange={(e) => setCamisaField('outros', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* MONOGRAMA */}
          <Card>
            <CardHeader><CardTitle className="text-base">🔤 Monograma <span className="text-slate-400 font-normal text-sm">(opcional)</span></CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Texto</Label>
                  <Input placeholder="ex: ASG"
                    value={monograma.mono_texto} onChange={(e) => setMonogramaField('mono_texto', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Tipo / Fonte</Label>
                  <Input placeholder="ex: Script, Block..."
                    value={monograma.mono_tipo} onChange={(e) => setMonogramaField('mono_tipo', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Cor</Label>
                  <Input placeholder="ex: Azul Navy"
                    value={monograma.mono_cor} onChange={(e) => setMonogramaField('mono_cor', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Local</Label>
                  <Input placeholder="ex: Punho esquerdo"
                    value={monograma.mono_local} onChange={(e) => setMonogramaField('mono_local', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Posição X</Label>
                  <Input type="number" step="0.1" placeholder="cm"
                    value={monograma.mono_x} onChange={(e) => setMonogramaField('mono_x', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Posição Y</Label>
                  <Input type="number" step="0.1" placeholder="cm"
                    value={monograma.mono_y} onChange={(e) => setMonogramaField('mono_y', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EXTRAS */}
          <Card>
            <CardHeader><CardTitle className="text-base">📝 Extras</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Data de entrega prevista</Label>
                <Input type="date" value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)} className="w-48" />
              </div>
              <div className="space-y-1">
                <Label>Observações</Label>
                <textarea
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="Notas adicionais..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'A registar...' : '✓ Registar Encomenda'}
          </Button>
        </form>
      </main>
    </div>
  )
}