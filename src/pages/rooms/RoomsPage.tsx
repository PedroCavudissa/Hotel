import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsApi, amenitiesApi } from '@/api/services'
import { PageSpinner, LazyImage, Modal, Badge, EmptyState, ConfirmDialog } from '@/components/ui'
import { Plus, Trash2, Brush, CheckCircle, Wrench, BedDouble, Filter } from 'lucide-react'
import { roomStatusColor, roomStatusLabel, formatCurrency, cn } from '@/utils'
import type { Room, RoomStatus } from '@/types'
import toast from 'react-hot-toast'

const STATUS_FILTERS: { label: string; value: RoomStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Disponível', value: 'available' },
  { label: 'Ocupado', value: 'occupied' },
  { label: 'Limpeza', value: 'cleaning' },
  { label: 'Manutenção', value: 'maintenance' },
]

export default function RoomsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ number: '', type: 'double', floor: '1', pricePerNight: '', capacity: '2', description: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { data: rooms = [], isLoading } = useQuery({ queryKey: ['rooms'], queryFn: () => roomsApi.list().then(r => r.data) })
  const { data: amenities = [] } = useQuery({ queryKey: ['amenities'], queryFn: () => amenitiesApi.list().then(r => r.data) })

  const createMutation = useMutation({
    mutationFn: () => roomsApi.create({ ...form, floor: +form.floor, pricePerNight: +form.pricePerNight, capacity: +form.capacity, image: imageFile ?? undefined, type: form.type as any }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); setShowCreate(false); toast.success('Quarto criado!') },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro ao criar quarto'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Quarto eliminado') },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      const map: Record<string, () => any> = {
        start_cleaning: () => roomsApi.startCleaning(id),
        finish_cleaning: () => roomsApi.finishCleaning(id),
        inspect: () => roomsApi.inspect(id),
        start_maintenance: () => roomsApi.startMaintenance(id, 'OOS'),
        finish_maintenance: () => roomsApi.finishMaintenance(id),
      }
      return map[action]()
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); toast.success('Estado atualizado') },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro'),
  })

  const filtered = rooms.filter(r => filter === 'all' || r.status === filter)

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Quartos <span className="text-stone-400 text-lg font-body font-normal">({rooms.length})</span></h1>
        <button className="btn-gold flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Novo Quarto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              filter === f.value ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<BedDouble size={48} />} title="Sem quartos" description="Crie o primeiro quarto para começar." action={<button className="btn-gold" onClick={() => setShowCreate(true)}>Criar quarto</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => <RoomCard key={room.id} room={room} onDelete={() => setDeleteId(room.id)} onStatusAction={(action) => statusMutation.mutate({ id: room.id, action })} />)}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Quarto" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Número</label><input className="input" placeholder="101" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} /></div>
          <div><label className="label">Tipo</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['single','double','suite','deluxe','presidential'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="label">Piso</label><input className="input" type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
          <div><label className="label">Preço / noite (AOA)</label><input className="input" type="number" placeholder="15000" value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))} /></div>
          <div><label className="label">Capacidade</label><input className="input" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></div>
          <div><label className="label">Imagem</label><input className="input" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} /></div>
          <div className="col-span-2"><label className="label">Descrição</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
          <button className="btn-gold" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'A criar...' : 'Criar Quarto'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar quarto" message="Tem a certeza que pretende eliminar este quarto? Esta ação não pode ser revertida." danger />
    </div>
  )
}

function RoomCard({ room, onDelete, onStatusAction }: { room: Room; onDelete: () => void; onStatusAction: (action: string) => void }) {
  const [showActions, setShowActions] = useState(false)

  const actions = [
    { label: 'Iniciar limpeza', action: 'start_cleaning', icon: Brush, show: ['available', 'occupied'].includes(room.status) },
    { label: 'Terminar limpeza', action: 'finish_cleaning', icon: CheckCircle, show: room.status === 'cleaning' },
    { label: 'Inspecionar', action: 'inspect', icon: CheckCircle, show: room.status === 'cleaning' },
    { label: 'Manutenção', action: 'start_maintenance', icon: Wrench, show: ['available'].includes(room.status) },
    { label: 'Terminar manutenção', action: 'finish_maintenance', icon: CheckCircle, show: room.status === 'maintenance' },
  ].filter(a => a.show)

  return (
    <div className="card p-0 overflow-hidden group hover:shadow-luxury-lg transition-shadow duration-300">
      <div className="relative h-40">
        <LazyImage src={room.image} alt={`Quarto ${room.number}`} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`badge ${roomStatusColor[room.status]}`}>{roomStatusLabel[room.status]}</span>
        </div>
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDelete} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-display font-semibold text-lg">#{room.number}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500 capitalize font-body">{room.type} · Piso {room.floor}</span>
          <span className="text-sm font-semibold text-stone-900">{formatCurrency(room.pricePerNight)}<span className="text-stone-400 font-normal text-xs">/noite</span></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-400">👥 {room.capacity} pessoas</span>
          {actions.length > 0 && (
            <div className="relative">
              <button className="text-xs text-gold-600 font-medium hover:text-gold-700" onClick={() => setShowActions(!showActions)}>
                Ações ▾
              </button>
              {showActions && (
                <div className="absolute right-0 bottom-full mb-1 bg-white border border-stone-100 rounded-xl shadow-luxury-lg z-20 min-w-[160px] overflow-hidden">
                  {actions.map(a => (
                    <button key={a.action} className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors text-left"
                      onClick={() => { onStatusAction(a.action); setShowActions(false) }}>
                      <a.icon size={14} className="text-stone-400" /> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
