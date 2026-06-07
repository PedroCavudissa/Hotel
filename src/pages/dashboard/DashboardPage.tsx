import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { reservationsApi, roomsApi, ticketsApi, reportsApi } from '@/api/services'
import { PageSpinner, LazyImage } from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { BedDouble, CalendarCheck2, Ticket, TrendingUp, Users, Clock } from 'lucide-react'
import { formatCurrency, roomStatusColor, roomStatusLabel, reservationStatusColor, reservationStatusLabel } from '@/utils'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

export default function DashboardPage() {
  const { data: rooms, isLoading: rl } = useQuery({ queryKey: ['rooms'], queryFn: () => roomsApi.list().then(r => r.data) })
  const { data: reservations, isLoading: resl } = useQuery({ queryKey: ['reservations'], queryFn: () => reservationsApi.list().then(r => r.data) })
  const { data: tickets } = useQuery({ queryKey: ['tickets'], queryFn: () => ticketsApi.list().then(r => r.data) })
  const { data: financial } = useQuery({ queryKey: ['financial'], queryFn: () => reportsApi.financial().then(r => r.data) })

  if (rl || resl) return <PageSpinner />

  const available = rooms?.filter(r => r.status === 'available').length ?? 0
  const occupied = rooms?.filter(r => r.status === 'occupied').length ?? 0
  const totalRooms = rooms?.length ?? 0
  const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0
  const todayCheckIns = reservations?.filter(r => r.status === 'confirmed').length ?? 0
  const openTickets = tickets?.filter(t => t.status === 'open').length ?? 0

  const stats = [
    { label: 'Taxa de Ocupação', value: `${occupancyRate}%`, icon: TrendingUp, color: 'bg-gold-50 text-gold-600', sub: `${occupied} de ${totalRooms} quartos` },
    { label: 'Quartos Disponíveis', value: available, icon: BedDouble, color: 'bg-emerald-50 text-emerald-600', sub: 'Prontos para check-in' },
    { label: 'Check-ins Hoje', value: todayCheckIns, icon: CalendarCheck2, color: 'bg-blue-50 text-blue-600', sub: 'Reservas confirmadas' },
    { label: 'Tickets Abertos', value: openTickets, icon: Ticket, color: 'bg-orange-50 text-orange-600', sub: 'Aguardam resolução' },
  ]

  const recentReservations = reservations?.slice(0, 5) ?? []
  const recentRooms = rooms?.slice(0, 6) ?? []

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-stone-400 mt-1 font-body">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-stone-900">{value}</p>
              <p className="text-sm font-medium text-stone-700 mt-0.5">{label}</p>
              <p className="text-xs text-stone-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + recent reservations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Financial chart */}
        <div className="card xl:col-span-2">
          <h2 className="section-title mb-4">Receita Mensal</h2>
          {financial && financial.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={financial.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'DM Mono' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'DM Mono' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontFamily: 'DM Sans' }} />
                <Line type="monotone" dataKey="revenue" stroke="#d49620" strokeWidth={2.5} dot={{ r: 4, fill: '#d49620' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-stone-300 text-sm">Sem dados disponíveis</div>
          )}
        </div>

        {/* Room status breakdown */}
        <div className="card">
          <h2 className="section-title mb-4">Estado dos Quartos</h2>
          <div className="space-y-2.5">
            {Object.entries(
              (rooms ?? []).reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status as keyof typeof acc] ?? 0) + 1 }), {} as Record<string, number>)
            ).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className={`badge ${roomStatusColor[status]}`}>{roomStatusLabel[status] ?? status}</span>
                <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-gold-400 rounded-full transition-all" style={{ width: `${(count / totalRooms) * 100}%` }} />
                </div>
                <span className="text-sm font-mono text-stone-600 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent reservations + rooms grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent reservations */}
        <div className="card">
          <h2 className="section-title mb-4">Reservas Recentes</h2>
          <div className="space-y-3">
            {recentReservations.length === 0 ? (
              <p className="text-sm text-stone-400">Sem reservas recentes.</p>
            ) : recentReservations.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center text-stone-500 flex-shrink-0">
                  <Users size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{r.guest?.name ?? `Hóspede #${r.guestId?.slice(0,6)}`}</p>
                  <p className="text-xs text-stone-400 flex items-center gap-1">
                    <Clock size={11} /> {r.checkIn?.slice(0, 10)} → {r.checkOut?.slice(0, 10)}
                  </p>
                </div>
                <span className={`badge ${reservationStatusColor[r.status]}`}>{reservationStatusLabel[r.status]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Room grid preview */}
        <div className="card">
          <h2 className="section-title mb-4">Quartos</h2>
          <div className="grid grid-cols-3 gap-3">
            {recentRooms.map(room => (
              <div key={room.id} className="relative rounded-xl overflow-hidden aspect-[4/3] group cursor-pointer">
                <LazyImage src={room.image} alt={`Quarto ${room.number}`} className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs font-semibold">#{room.number}</p>
                  <span className={`badge text-[10px] ${roomStatusColor[room.status]}`}>{roomStatusLabel[room.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
