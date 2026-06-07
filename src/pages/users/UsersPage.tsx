import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, authApi } from '@/api/services'
import { PageSpinner, EmptyState, ConfirmDialog } from '@/components/ui'
import { Users, Trash2, UserCheck, UserX, Search } from 'lucide-react'
import { cn, formatDate } from '@/utils'
import toast from 'react-hot-toast'

const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  RECEPTION: 'bg-blue-100 text-blue-700',
  CLIENT: 'bg-stone-100 text-stone-600',
}
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  RECEPTION: 'Recepção',
  CLIENT: 'Cliente',
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Utilizador eliminado') },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? authApi.disableUser(id) : authApi.activateUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Estado atualizado') },
  })

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const stats = [
    { label: 'Admins',    count: users.filter(u => u.role === 'ADMIN').length,       color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Recepção',  count: users.filter(u => u.role === 'RECEPTION').length, color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Clientes',  count: users.filter(u => u.role === 'CLIENT').length,        color: 'text-stone-600',  bg: 'bg-stone-50' },
    { label: 'Ativos',    count: users.filter(u => u.isActive).length,                color: 'text-emerald-600',bg: 'bg-emerald-50' },
  ]

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="page-title">Utilizadores <span className="text-stone-400 text-lg font-body font-normal">({users.length})</span></h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.bg}`}>
            <span className={`text-2xl font-display font-semibold ${s.color}`}>{s.count}</span>
            <span className={`text-sm font-medium ${s.color}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input className="input pl-9" placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[{ v: 'all', l: 'Todos' }, { v: 'ADMIN', l: 'Administradores' }, { v: 'RECEPTION', l: 'Recepcionistas' }, { v: 'CLIENT', l: 'Clientes' }].map(f => (
            <button key={f.v} onClick={() => setRoleFilter(f.v)}
              className={cn('px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                roleFilter === f.v ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50')}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="Sem utilizadores" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="table-head text-left px-4 py-3">Utilizador</th>
                  <th className="table-head text-left px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="table-head text-left px-4 py-3">Perfil</th>
                  <th className="table-head text-left px-4 py-3 hidden md:table-cell">Estado</th>
                  <th className="table-head text-left px-4 py-3 hidden lg:table-cell">Registado</th>
                  <th className="table-head text-left px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'RECEPTION' ? 'bg-blue-100 text-blue-700' : 'bg-stone-200 text-stone-600')}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-stone-800">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-500 hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ROLE_COLOR[user.role] ?? 'bg-stone-100 text-stone-600'}`}>{ROLE_LABEL[user.role] ?? user.role}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className={`badge w-fit ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{user.isActive ? 'Ativo' : 'Inativo'}</span>
                        {!user.isVerified && <span className="badge w-fit bg-amber-100 text-amber-700">Não verificado</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-400 hidden lg:table-cell">{user.createdAt ? formatDate(user.createdAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button title={user.isActive ? 'Desativar' : 'Ativar'}
                          className={cn('p-1.5 rounded-lg transition-colors', user.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}
                          onClick={() => toggleMutation.mutate({ id: user.id, active: user.isActive })}>
                          {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" onClick={() => setDeleteId(user.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar utilizador" message="Tem a certeza? Esta ação não pode ser revertida." danger />
    </div>
  )
}
