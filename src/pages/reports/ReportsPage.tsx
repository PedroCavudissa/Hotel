import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/services'
import { PageSpinner } from '@/components/ui'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCurrency, formatDate } from '@/utils'

export default function ReportsPage() {
  const [range, setRange] = useState('30')

  // Calcular datas para o range
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(range))
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const { data: occupancy = [], isLoading: ol } = useQuery({ 
    queryKey: ['occupancy', range], 
    queryFn: () => reportsApi.occupancy(getDateRange()).then(r => r.data) 
  })

  const { data: financial = [], isLoading: fl } = useQuery({ 
    queryKey: ['financial', range], 
    queryFn: () => reportsApi.financial(getDateRange()).then(r => r.data) 
  })

  if (ol || fl) return <PageSpinner />

  // Calcular totais
  const totalRevenue = financial.reduce((acc, r) => acc + (r.revenue ?? 0), 0)
  const avgOccupancy = occupancy.length > 0 ? Math.round(occupancy.reduce((acc, o) => acc + (o.occupancyRate ?? 0), 0) / occupancy.length) : 0
  const totalReservations = financial.reduce((acc, r) => acc + (r.reservations ?? 0), 0)

  // Estatísticas adicionais
  const peakRevenue = financial.length > 0 ? Math.max(...financial.map(r => r.revenue ?? 0)) : 0
  const peakOccupancy = occupancy.length > 0 ? Math.max(...occupancy.map(o => o.occupancyRate ?? 0)) : 0

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#001E3D]">Relatórios</h1>
          <p className="text-sm text-slate-500 mt-1">Análise de desempenho e métricas do hotel</p>
        </div>
        <select 
          className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:border-[#001E3D] focus:outline-none" 
          value={range} 
          onChange={e => setRange(e.target.value)}
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-3xl font-serif font-bold text-[#001E3D] mb-1">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm font-medium text-slate-600">Receita Total</p>
          <p className="text-xs text-slate-400 mt-0.5">{totalReservations} reservas</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-3xl font-serif font-bold text-[#001E3D] mb-1">{avgOccupancy}%</p>
          <p className="text-sm font-medium text-slate-600">Taxa Média de Ocupação</p>
          <p className="text-xs text-slate-400 mt-0.5">Média do período</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-3xl font-serif font-bold text-[#001E3D] mb-1">
            {formatCurrency(totalReservations > 0 ? totalRevenue / totalReservations : 0)}
          </p>
          <p className="text-sm font-medium text-slate-600">Ticket Médio</p>
          <p className="text-xs text-slate-400 mt-0.5">Por reserva</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-3xl font-serif font-bold text-[#001E3D] mb-1">{peakRevenue > 0 ? formatCurrency(peakRevenue) : 'Kz 0'}</p>
          <p className="text-sm font-medium text-slate-600">Pico de Receita</p>
          <p className="text-xs text-slate-400 mt-0.5">Maior dia do período</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-[#001E3D] mb-4">Receita por Período</h2>
        {financial.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={financial}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fontFamily: 'DM Mono' }} 
                tickFormatter={d => d?.slice(5) ?? ''} 
              />
              <YAxis 
                tick={{ fontSize: 11, fontFamily: 'DM Mono' }} 
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(v: number) => formatCurrency(v)} 
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'DM Sans' }} 
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#D4AF37" 
                strokeWidth={2.5} 
                fill="url(#revGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
            Sem dados de receita para o período selecionado
          </div>
        )}
      </div>

      {/* Occupancy chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-[#001E3D] mb-4">Taxa de Ocupação</h2>
        {occupancy.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fontFamily: 'DM Mono' }} 
                tickFormatter={d => d?.slice(5) ?? ''} 
              />
              <YAxis 
                tick={{ fontSize: 11, fontFamily: 'DM Mono' }} 
                tickFormatter={v => `${v}%`} 
                domain={[0, 100]} 
              />
              <Tooltip 
                formatter={(v: number) => `${v}%`} 
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'DM Sans' }} 
              />
              <Bar 
                dataKey="occupancyRate" 
                fill="#001E3D" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
            Sem dados de ocupação para o período selecionado
          </div>
        )}
      </div>
    </div>
  )
}