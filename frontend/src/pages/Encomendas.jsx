import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const ESTADOS = ['Recebida', 'Aguarda Tecido', 'Corte', 'Producao', 'Pendente', 'Pronta', 'Enviada']

const ESTADO_COR = {
  'Recebida': 'bg-blue-100 text-blue-800',
  'Aguarda Tecido': 'bg-yellow-100 text-yellow-800',
  'Corte': 'bg-orange-100 text-orange-800',
  'Producao': 'bg-purple-100 text-purple-800',
  'Pendente': 'bg-red-100 text-red-800',
  'Pronta': 'bg-green-100 text-green-800',
  'Enviada': 'bg-slate-100 text-slate-600',
}

export default function Encomendas() {
  const { loja, logout } = useAuth()
  const navigate = useNavigate()
  const [encomendas, setEncomendas] = useState([])
  const [lojas, setLojas] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroLoja, setFiltroLoja] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (loja?.is_admin) {
      api.get('/admin/lojas').then((r) => setLojas(r.data))
    }
  }, [loja])

  useEffect(() => {
    setLoading(true)
    const endpoint = loja?.is_admin ? '/admin/encomendas' : '/encomendas/'
    const params = {}
    if (filtroEstado !== 'todos') params.estado = filtroEstado
    if (loja?.is_admin && filtroLoja !== 'todos') params.loja_id = filtroLoja
    api.get(endpoint, { params })
      .then((r) => setEncomendas(r.data))
      .finally(() => setLoading(false))
  }, [filtroEstado, filtroLoja, loja])

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
          <Button size="sm" onClick={() => navigate('/')}>+ Nova Encomenda</Button>
          <Button variant="outline" size="sm" onClick={logout}>Sair</Button>
        </div>
        {loja?.is_admin && (
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>Admin</Button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Encomendas</h2>
          <div className="flex gap-2">
            {loja?.is_admin && (
              <Select value={filtroLoja} onValueChange={setFiltroLoja}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as lojas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as lojas</SelectItem>
                  {lojas.filter(l => !l.is_admin).map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-slate-400 py-12">A carregar...</p>
        ) : encomendas.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Nenhuma encomenda encontrada.</p>
        ) : (
          <div className="space-y-3">
            {encomendas.map((enc) => (
              <Card key={enc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/encomendas/${enc.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-400">#{enc.numero}</span>
                    <div>
                      <p className="font-medium text-slate-800">{enc.cliente?.nome}</p>
                      <p className="text-xs text-slate-500">
                        {enc.ref_tecido || '—'}
                        {loja?.is_admin && enc.loja_id && (
                          <span className="ml-2 text-slate-400">
                            · {lojas.find(l => l.id === enc.loja_id)?.nome}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COR[enc.estado] || 'bg-slate-100 text-slate-600'}`}>
                        {enc.estado}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(enc.criado_em).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    {enc.data_entrega_prevista && (
                      <div className="text-xs text-slate-500 hidden md:block">
                        <p className="text-slate-400">Entrega</p>
                        <p>{new Date(enc.data_entrega_prevista).toLocaleDateString('pt-PT')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}