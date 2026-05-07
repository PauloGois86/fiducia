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

function Header({ loja, logout, navigate }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🧵</span>
        <div>
          <h1 className="font-bold text-slate-800">Fiducia Atelier</h1>
          <p className="text-xs text-slate-500">{loja?.nome} · Admin</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/encomendas')}>Encomendas</Button>
        <Button variant="outline" size="sm" onClick={logout}>Sair</Button>
      </div>
    </header>
  )
}

// ── Modal simples ─────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-slate-800">{titulo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Secção Lojas ──────────────────────────────────────────────────
function SecaoLojas({ lojas, onRefresh }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const criar = async () => {
    setLoading(true)
    try {
      await api.post('/admin/lojas', form)
      toast.success('Loja criada!')
      setModal(false)
      setForm({ nome: '', email: '', telefone: '', password: '' })
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar loja')
    } finally {
      setLoading(false)
    }
  }

  const toggleAtivo = async (loja) => {
    try {
      await api.patch(`/admin/lojas/${loja.id}`, { ativo: !loja.ativo })
      toast.success(loja.ativo ? 'Loja desactivada' : 'Loja activada')
      onRefresh()
    } catch {
      toast.error('Erro ao actualizar loja')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">🏪 Lojas</CardTitle>
        <Button size="sm" onClick={() => setModal(true)}>+ Nova Loja</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lojas.filter(l => !l.is_admin).map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
              <div>
                <p className="font-medium text-slate-800 text-sm">{l.nome}</p>
                <p className="text-xs text-slate-400">{l.email} {l.telefone ? `· ${l.telefone}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${l.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {l.ativo ? 'Activa' : 'Inactiva'}
                </span>
                <Button variant="outline" size="sm" onClick={() => toggleAtivo(l)}>
                  {l.ativo ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {modal && (
        <Modal titulo="Nova Loja" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input placeholder="Nome da loja" value={form.nome}
                onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="email@loja.pt" value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input placeholder="2XXXXXXXX" value={form.telefone}
                onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" placeholder="Password inicial" value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={criar} disabled={loading}>
                {loading ? 'A criar...' : 'Criar Loja'}
              </Button>
              <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  )
}

// ── Secção Clientes ───────────────────────────────────────────────
function SecaoClientes({ lojas }) {
  const [lojaId, setLojaId] = useState('')
  const [clientes, setClientes] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', notas: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lojaId) {
      api.get('/admin/clientes', { params: { loja_id: lojaId } })
        .then(r => setClientes(r.data))
    } else {
      setClientes([])
    }
  }, [lojaId])

  const criar = async () => {
    if (!lojaId) { toast.error('Selecciona uma loja'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/admin/clientes', { ...form, loja_id: Number(lojaId) })
      setClientes(p => [...p, data])
      toast.success('Cliente criado!')
      setModal(false)
      setForm({ nome: '', email: '', telefone: '', notas: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">👤 Clientes</CardTitle>
        <Button size="sm" onClick={() => setModal(true)}>+ Novo Cliente</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={lojaId} onValueChange={setLojaId}>
          <SelectTrigger><SelectValue placeholder="Selecciona uma loja..." /></SelectTrigger>
          <SelectContent>
            {lojas.filter(l => !l.is_admin).map(l => (
              <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {clientes.length === 0 && lojaId && (
          <p className="text-sm text-slate-400 text-center py-4">Nenhum cliente nesta loja.</p>
        )}

        <div className="space-y-2">
          {clientes.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
              <div>
                <p className="font-medium text-slate-800 text-sm">{c.nome}</p>
                <p className="text-xs text-slate-400">
                  {[c.email, c.telefone].filter(Boolean).join(' · ') || '—'}
                </p>
                {c.notas && <p className="text-xs text-slate-400 italic mt-0.5">{c.notas}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {modal && (
        <Modal titulo="Novo Cliente" onClose={() => setModal(false)}>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Loja</Label>
              <Select value={lojaId} onValueChange={setLojaId}>
                <SelectTrigger><SelectValue placeholder="Selecciona uma loja..." /></SelectTrigger>
                <SelectContent>
                  {lojas.filter(l => !l.is_admin).map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input placeholder="Nome completo" value={form.nome}
                onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="email@exemplo.pt" value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input placeholder="9XXXXXXXX" value={form.telefone}
                onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Input placeholder="Notas internas..." value={form.notas}
                onChange={(e) => setForm(p => ({ ...p, notas: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={criar} disabled={loading}>
                {loading ? 'A criar...' : 'Criar Cliente'}
              </Button>
              <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  )
}

// ── Estatísticas ──────────────────────────────────────────────────
function Estatisticas({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Lojas activas', valor: stats.lojas, icon: '🏪' },
        { label: 'Clientes', valor: stats.clientes, icon: '👤' },
        { label: 'Encomendas', valor: stats.encomendas, icon: '📦' },
        { label: 'Em produção', valor: stats.emProducao, icon: '🔧' },
      ].map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{s.valor}</div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────
export default function Admin() {
  const { loja, logout } = useAuth()
  const navigate = useNavigate()
  const [lojas, setLojas] = useState([])
  const [stats, setStats] = useState({ lojas: 0, clientes: 0, encomendas: 0, emProducao: 0 })
  const [tab, setTab] = useState('lojas')

  const carregarLojas = () => {
    api.get('/admin/lojas').then(r => {
      const ls = r.data
      setLojas(ls)
      setStats(p => ({ ...p, lojas: ls.filter(l => !l.is_admin && l.ativo).length }))
    })
  }

  useEffect(() => {
    if (!loja?.is_admin) { navigate('/'); return }
    carregarLojas()
    api.get('/admin/clientes').then(r => setStats(p => ({ ...p, clientes: r.data.length })))
    api.get('/admin/encomendas').then(r => {
      const encs = r.data
      setStats(p => ({
        ...p,
        encomendas: encs.length,
        emProducao: encs.filter(e => ['Corte', 'Producao'].includes(e.estado)).length
      }))
    })
  }, [loja])

  return (
    <div className="min-h-screen bg-slate-50">
      <Header loja={loja} logout={logout} navigate={navigate} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Painel de Administração</h2>

        <Estatisticas stats={stats} />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { key: 'lojas', label: '🏪 Lojas' },
            { key: 'clientes', label: '👤 Clientes' },
          ].map(t => (
            <button key={t.key}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
              onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'lojas' && <SecaoLojas lojas={lojas} onRefresh={carregarLojas} />}
        {tab === 'clientes' && <SecaoClientes lojas={lojas} />}
      </main>
    </div>
  )
}