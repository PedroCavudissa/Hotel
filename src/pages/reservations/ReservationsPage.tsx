import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reservationsApi, roomsApi, usersApi } from '@/api/services'
import { PageSpinner, ConfirmDialog } from '@/components/ui'
import {
  Plus, CreditCard, LogIn, LogOut, X, Search,
  ChevronLeft, Calendar, Users, MapPin, Phone, Mail,
  User, FileText, CheckCircle, ArrowRight, Home,
  BedDouble, Moon, Sparkles, ChevronRight, Clock,
  DollarSign, StickyNote, Upload, AlertCircle, Edit2
} from 'lucide-react'
import { formatDate, formatCurrency, cn } from '@/utils'
import type { ReservationStatus } from '@/types'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

type FormStep = 'select-room' | 'guest-data' | 'review'

const STATUS_META: Record<string, { label: string; dot: string; pill: string }> = {
  pending: { label: 'Pendente', dot: '#D97706', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmada', dot: '#059669', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_in: { label: 'Check-in', dot: '#2563EB', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  checked_out: { label: 'Check-out', dot: '#64748B', pill: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'Cancelada', dot: '#DC2626', pill: 'bg-red-50 text-red-700 border-red-200' },
  expired: { label: 'Expirada', dot: '#9CA3AF', pill: 'bg-gray-100 text-gray-500 border-gray-200' },
  completed: { label: 'Concluída', dot: '#16A34A', pill: 'bg-green-50 text-green-700 border-green-200' },
}

const STATUS_TABS: { label: string; value: ReservationStatus | 'all' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Confirmadas', value: 'confirmed' },
  { label: 'Check-in', value: 'checked_in' },
  { label: 'Check-out', value: 'checked_out' },
  { label: 'Canceladas', value: 'cancelled' },
]

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, dot: '#9CA3AF', pill: 'bg-gray-100 text-gray-500 border-gray-200' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap', m.pill)}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: m.dot }} />
      {m.label}
    </span>
  )
}

const STEPS: FormStep[] = ['select-room', 'guest-data', 'review']
const STEP_LABELS = ['Quarto & Datas', 'Dados do Hóspede', 'Confirmação']

function Field({ label, icon: Icon, children, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        {children}
      </div>
    </div>
  )
}

const inputCls = (hasIcon = true) =>
  cn(
    'w-full py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800',
    'focus:border-[#001E3D] focus:outline-none focus:ring-2 focus:ring-[#001E3D]/10 transition-all placeholder:text-slate-300',
    hasIcon ? 'pl-9 pr-3' : 'px-3'
  )

/* ─────────────── COMPONENTE UPLOAD DE COMPROVATIVO ─────────────── */
function PaymentProofForm({ reservationId, onProofUploaded }: { reservationId: string; onProofUploaded: () => void }) {
  const qc = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadProofMutation = useMutation({
    mutationFn: (file: File) => reservationsApi.uploadPaymentProof(reservationId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Comprovativo enviado com sucesso!')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onProofUploaded()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro ao enviar comprovativo'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB')
        return
      }
      setSelectedFile(file)
    }
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-[#001E3D] uppercase tracking-wider">
        <Upload size={14} />
        <span>Anexar Comprovativo Bancário</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,application/pdf"
          onChange={handleFileChange}
          className="flex-1 text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#001E3D] file:text-white hover:file:bg-[#002d5c] cursor-pointer"
        />
        {selectedFile && (
          <button
            onClick={() => uploadProofMutation.mutate(selectedFile)}
            disabled={uploadProofMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {uploadProofMutation.isPending ? 'A enviar...' : 'Enviar'}
          </button>
        )}
      </div>
      {selectedFile && (
        <p className="text-[10px] text-slate-500">
          Arquivo: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  )
}


/* ─────────────── COMPONENTE REMARCAR DATAS (CORRIGIDO) ─────────────── */
function RescheduleForm({ reservation, onClose, onSuccess, isStaff }: {
  reservation: any;
  onClose: () => void;
  onSuccess: () => void;
  isStaff: boolean;
}) {
  // Usar as datas atuais da reserva
  const [checkIn, setCheckIn] = useState(reservation.checkIn?.split('T')[0] || '')
  const [checkOut, setCheckOut] = useState(reservation.checkOut?.split('T')[0] || '')
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  const originalNights = Math.ceil(
    (new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)
  )

  const newNights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  )

  const pricePerNight = reservation.room?.pricePerNight || 0
  const originalTotal = pricePerNight * originalNights
  const newTotal = pricePerNight * newNights
  const difference = newTotal - originalTotal

  // Verificar se o check-in original já passou
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const originalCheckIn = new Date(reservation.checkIn)
  originalCheckIn.setHours(0, 0, 0, 0)
  const isCheckInPassed = originalCheckIn < today

  const handleSubmit = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Preencha as datas')
      return
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate >= checkOutDate) {
      toast.error('Check-out deve ser maior que check-in')
      return
    }

    // Para CLIENTES: não permitir check-in no passado
    if (!isStaff && checkInDate < today) {
      toast.error('Não é possível alterar para datas passadas')
      return
    }

    // Para STAFF: permitir, mas com confirmação
    if (isStaff && checkInDate < today) {
      const confirmed = window.confirm(
        `⚠️ ATENÇÃO: A data de check-in (${formatDate(checkIn)}) é anterior a hoje.\n\n` +
        `Esta ação irá marcar o quarto como ocupado retroativamente.\n\n` +
        `Deseja continuar?`
      )
      if (!confirmed) return
    }

    setLoading(true)
    try {
      await reservationsApi.reschedule(reservation.id, {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        reason: reason.trim() || `Alteração de datas: ${formatDate(reservation.checkIn)} → ${formatDate(checkIn)} até ${formatDate(checkOut)}`
      })
      
      if (difference > 0) {
        toast.success(`Estadia estendida! Valor adicional: ${formatCurrency(difference)}`)
      } else if (difference < 0) {
        toast.info(`Estadia reduzida! Crédito de ${formatCurrency(Math.abs(difference))}`)
      } else {
        toast.success('Datas atualizadas com sucesso!')
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Erro ao remarcar reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 space-y-4 max-w-md w-full">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Calendar size={16} className="text-[#001E3D]" />
        <h3 className="text-lg font-serif font-bold text-[#001E3D]">Remarcar Reserva</h3>
      </div>

      {/* Aviso para staff */}
      {isCheckInPassed && isStaff && (
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700 flex items-start gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Esta reserva já está em andamento.</strong><br />
              Pode alterar o check-out para estender a estadia. O valor adicional será calculado automaticamente.
            </span>
          </p>
        </div>
      )}

      {/* Informação atual */}
      <div className="bg-slate-50 p-3 rounded-lg">
        <p className="text-xs text-slate-500 mb-2">Período atual:</p>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">Check-in</p>
            <p className="text-sm font-semibold text-slate-700">{formatDate(reservation.checkIn)}</p>
          </div>
          <ArrowRight size={16} className="text-slate-300" />
          <div>
            <p className="text-xs text-slate-400">Check-out</p>
            <p className="text-sm font-semibold text-slate-700">{formatDate(reservation.checkOut)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Noites</p>
            <p className="text-sm font-semibold text-slate-700">{originalNights}</p>
          </div>
        </div>
      </div>

      {/* Novas datas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Check-in {!isStaff && '*'}
          </label>
          <input
            type="date"
            min={isStaff ? undefined : new Date().toISOString().split('T')[0]}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border focus:outline-none text-sm ${
              !isStaff && checkIn < today.toISOString().split('T')[0]
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 focus:border-[#001E3D]'
            }`}
            disabled={!isStaff} // Apenas staff pode alterar check-in
          />
          {!isStaff && (
            <p className="text-[10px] text-slate-400 mt-1">Check-in não pode ser alterado</p>
          )}
          {isStaff && checkIn < today.toISOString().split('T')[0] && (
            <p className="text-[10px] text-amber-600 mt-1">⚠️ Data no passado (apenas staff)</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Novo Check-out *</label>
          <input
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#001E3D] focus:outline-none text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo da alteração</label>
        <input
          type="text"
          placeholder="Ex: Estadia estendida pelo hóspede"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#001E3D] focus:outline-none text-sm"
        />
      </div>

      {/* Resumo da alteração */}
      {(checkIn !== reservation.checkIn?.split('T')[0] || checkOut !== reservation.checkOut?.split('T')[0]) && (
        <div className={`p-3 rounded-lg space-y-2 ${difference > 0 ? 'bg-amber-50' : difference < 0 ? 'bg-emerald-50' : 'bg-blue-50'}`}>
          <p className="text-xs font-semibold text-slate-600">Resumo da alteração:</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Noites:</span>
            <span className="font-semibold">{originalNights} → {newNights}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Valor:</span>
            <span className="font-semibold">{formatCurrency(originalTotal)} → {formatCurrency(newTotal)}</span>
          </div>
          {difference !== 0 && (
            <div className="text-xs pt-1 border-t border-slate-200 mt-1">
              {difference > 0 ? (
                <span className="text-amber-600">➕ Valor adicional: {formatCurrency(difference)}</span>
              ) : (
                <span className="text-emerald-600">➖ Valor a reembolsar: {formatCurrency(Math.abs(difference))}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !checkIn || !checkOut}
          className="flex-1 bg-[#001E3D] hover:bg-[#002d5c] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'A processar...' : difference > 0 ? `Confirmar +${formatCurrency(difference)}` : 'Confirmar Alteração'}
        </button>
      </div>
    </div>
  )
}



/* ─────────────── COMPONENTE CANCELAR RESERVA ─────────────── */
function CancelReservationForm({ reservation, onClose, onSuccess }: {
  reservation: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Informe o motivo do cancelamento')
      return
    }

    setLoading(true)
    try {
      await reservationsApi.cancel(reservation.id, reason)
      toast.success('Reserva cancelada com sucesso!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Erro ao cancelar reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 space-y-4 max-w-md w-full">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <X size={16} className="text-red-600" />
        <h3 className="text-lg font-serif font-bold text-red-600">Cancelar Reserva</h3>
      </div>
      
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo do cancelamento *</label>
        <textarea
          placeholder="Ex: Hóspede desistiu da reserva, Problemas com pagamento, etc."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-red-400 focus:outline-none text-sm resize-none"
        />
      </div>

      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
        <p className="text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={14} />
          Esta ação não pode ser desfeita. O quarto será liberado para novas reservas.
        </p>
        {reservation.amountPaid > 0 && (
          <p className="text-xs text-amber-700 mt-2">
            ⚠️ Esta reserva já possui pagamento. Serão aplicadas taxas de cancelamento conforme política do hotel.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !reason.trim()}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'A cancelar...' : 'Confirmar Cancelamento'}
        </button>
      </div>
    </div>
  )
}

/* ─────────────── DETAIL PANEL ─────────────── */
function ReservationDetailPanel({ reservation: r, onClose, isStaff, isClient, onAction, refetch }: any) {
  const name = r.guest?.name ?? r.user?.name ?? 'Hóspede'
  const [showProofUpload, setShowProofUpload] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [showPaymentMethod, setShowPaymentMethod] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  const nights = (() => {
    const diff = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()
    return diff > 0 ? Math.ceil(diff / 86_400_000) : 0
  })()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkInDate = new Date(r.checkIn)
  checkInDate.setHours(0, 0, 0, 0)
  const isCheckInDay = checkInDate.getTime() <= today.getTime()
  const canCheckIn = r.status === 'CONFIRMED' && isCheckInDay
  const canCheckOut = r.status === 'CHECKED_IN'
  const isOverdueReservation = r.status === 'CONFIRMED' && checkInDate.getTime() < today.getTime()
  const hasProof = !!r.paymentProofUrl
  const formattedCheckInDate = formatDate(r.checkIn)
  
  // Verificar se pode cancelar
  const canCancel = ['PENDING', 'CONFIRMED'].includes(r.status)
  
  // Verificar se pode remarcar
  const canReschedule = isStaff && ['PENDING', 'CONFIRMED'].includes(r.status)

  const handleConfirmPayment = () => setShowPaymentMethod(true)
  const handlePaymentConfirm = () => {
    onAction(r.id, 'pay', { method: paymentMethod })
    setShowPaymentMethod(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="bg-[#001E3D] px-6 py-5 flex-shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase mb-1">Detalhes da Reserva</p>
              <h2 className="text-xl font-serif font-bold text-white leading-tight">{name}</h2>
              <p className="text-slate-300 text-sm mt-0.5">Quarto #{r.room?.number} · {r.room?.type}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} className="text-white/70" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <StatusPill status={r.status} />
            {hasProof && r.status === 'PENDING' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                <CheckCircle size={10} /> Comprovativo enviado
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 flex-shrink-0">
          {[
            { label: 'Check-in', value: formatDate(r.checkIn) },
            { label: 'Check-out', value: formatDate(r.checkOut) },
            { label: 'Noites', value: `${nights}n` },
          ].map(({ label, value }) => (
            <div key={label} className="px-3 py-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {/* Financeiro */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <DollarSign size={12} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financeiro</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Diária</span>
                  <span className="text-xs font-semibold text-slate-700">{formatCurrency(r.room?.pricePerNight ?? 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Noites</span>
                  <span className="text-xs font-semibold text-slate-700">× {nights}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-1">
                  <span className="text-sm font-bold text-[#001E3D]">Total</span>
                  <span className="text-xl font-black text-[#001E3D] font-serif">{formatCurrency(r.totalPrice)}</span>
                </div>
                {r.amountPaid > 0 && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-xs text-slate-400">Valor pago</span>
                    <span className="text-xs font-semibold text-emerald-600">{formatCurrency(r.amountPaid)}</span>
                  </div>
                )}
                {r.paymentProofUrl && (
                  <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle size={13} /> Comprovativo Anexado
                    </span>
                    <a href={r.paymentProofUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-emerald-600 hover:underline">
                      Visualizar
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Hóspede */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <User size={12} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hóspede</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Nome</span>
                  <span className="text-xs font-semibold text-slate-700">{name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Email</span>
                  <span className="text-xs font-semibold text-slate-700">{r.guest?.email ?? r.user?.email ?? '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Telefone</span>
                  <span className="text-xs font-semibold text-slate-700">{r.guest?.phone ?? r.user?.phone ?? '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Documento</span>
                  <span className="text-xs font-semibold text-slate-700">{r.guest?.idDocument ?? '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">País</span>
                  <span className="text-xs font-semibold text-slate-700">{r.guest?.country ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Quarto */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <BedDouble size={12} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quarto</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Número</span>
                  <span className="text-xs font-semibold text-slate-700">#{r.room?.number}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Tipo</span>
                  <span className="text-xs font-semibold text-slate-700">{r.room?.type ?? '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400">Capacidade</span>
                  <span className="text-xs font-semibold text-slate-700">{r.room?.capacity ?? '—'} hóspedes</span>
                </div>
              </div>
            </div>

            {r.notes && (
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <StickyNote size={12} className="text-slate-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{r.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ações - Staff */}
        {isStaff && (
          <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0 bg-slate-50/80">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ações Administrativas</p>
            <div className="flex flex-wrap gap-2">
              {r.status === 'PENDING' && (
                <button onClick={handleConfirmPayment} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CreditCard size={13} /> Confirmar Pagamento
                </button>
              )}
              
              {r.status === 'CONFIRMED' && (
                <button onClick={() => { if (canCheckIn) { onAction(r.id, 'checkin'); onClose() } else { toast.error(`Check-in permitido apenas a partir de ${formattedCheckInDate}`) } }} disabled={!canCheckIn} className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all', canCheckIn ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 cursor-not-allowed text-gray-500')}>
                  <LogIn size={13} /> {canCheckIn ? 'Fazer Check-in' : `Check-in em ${formattedCheckInDate}`}
                </button>
              )}
              
              {canCheckOut && (
                <button onClick={() => { onAction(r.id, 'checkout'); onClose() }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all bg-orange-500 hover:bg-orange-600 text-white">
                  <LogOut size={13} /> Fazer Check-out
                </button>
              )}
              
              {isOverdueReservation && (
                <button onClick={() => { if (window.confirm("Esta reserva não teve check-in formalizado. Deseja forçar o Check-out?")) { onAction(r.id, 'checkout'); onClose() } }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all bg-red-600 hover:bg-red-700 text-white">
                  <AlertCircle size={13} /> Forçar Check-out
                </button>
              )}
              
              {canReschedule && (
                <button onClick={() => setShowReschedule(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Edit2 size={13} /> Remarcar
                </button>
              )}
              
              {canCancel && (
                <button onClick={() => setShowCancelForm(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all bg-red-50 hover:bg-red-100 text-red-700 border border-red-200">
                  <X size={13} /> Cancelar
                </button>
              )}
            </div>
            
            {isOverdueReservation && (
              <p className="text-xs text-amber-600 mt-3 text-center bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠️ Esta estadia já deveria ter sido iniciada. Utilize o botão acima para regularizar.
              </p>
            )}
          </div>
        )}

        {/* Ações - Cliente */}
        {isClient && r.status === 'PENDING' && !r.paymentProofUrl && (
          <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0 bg-slate-50/80">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Suas Ações</p>
            <div className="flex flex-col gap-2">
              {!showProofUpload ? (
                <button onClick={() => setShowProofUpload(true)} className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                  <Upload size={14} /> Anexar Comprovativo
                </button>
              ) : (
                <PaymentProofForm reservationId={r.id} onProofUploaded={() => setShowProofUpload(false)} />
              )}
              
              <button onClick={() => setShowReschedule(true)} className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                <Edit2 size={14} /> Remarcar Reserva
              </button>
              
              <button onClick={() => setShowCancelForm(true)} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-red-200">
                <X size={14} /> Cancelar Reserva
              </button>
            </div>
          </div>
        )}
        
        {isClient && r.status === 'PENDING' && r.paymentProofUrl && (
          <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0 bg-slate-50/80">
            <div className="bg-blue-50 p-3 rounded-xl text-center">
              <p className="text-xs text-blue-700">
                <CheckCircle size={12} className="inline mr-1" />
                Seu comprovativo foi enviado. Aguarde a confirmação do pagamento.
              </p>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowReschedule(true)} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                <Edit2 size={14} /> Remarcar
              </button>
              <button onClick={() => setShowCancelForm(true)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-red-200">
                <X size={14} /> Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {showPaymentMethod && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-serif font-bold text-[#001E3D]">Confirmar Pagamento</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Selecione o método de pagamento:</p>
              <div className="space-y-2">
                {[
                  { value: 'CASH', label: 'Dinheiro' },
                  { value: 'CARD', label: 'Cartão' },
                  { value: 'TRANSFER', label: 'Transferência' },
                  { value: 'INSURANCE', label: 'Seguro' }
                ].map(method => (
                  <label key={method.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input type="radio" name="paymentMethod" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} className="w-4 h-4 text-[#001E3D]" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50" onClick={() => setShowPaymentMethod(false)}>Cancelar</button>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium" onClick={handlePaymentConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showReschedule && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <RescheduleForm 
            reservation={r} 
            onClose={() => setShowReschedule(false)} 
            onSuccess={() => { refetch(); setShowReschedule(false); onClose() }} 
          />
        </div>
      )}

      {showCancelForm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <CancelReservationForm 
            reservation={r} 
            onClose={() => setShowCancelForm(false)} 
            onSuccess={() => { refetch(); setShowCancelForm(false); onClose() }} 
          />
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */
export default function ReservationsPage() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const roomIdFromUrl = searchParams.get('roomId')

  const { user: currentUser } = useAuthStore()
  const isStaff = ['ADMIN', 'MANAGER', 'RECEPTION'].includes(currentUser?.role ?? '')
  const isClient = currentUser?.role === 'CLIENT'

  const [tab, setTab] = useState<ReservationStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [isWalkIn, setIsWalkIn] = useState(true)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<FormStep>('select-room')
  const [selectedRes, setSelectedRes] = useState<any | null>(null)
  const [uploadingInlineId, setUploadingInlineId] = useState<string | null>(null)

  const emptyForm = () => ({
    roomId: '', checkIn: '', checkOut: '', adults: '1', children: '0', notes: '', userId: '',
    guest: { name: currentUser?.name || '', email: currentUser?.email || '', phone: '', idDocument: '', province: '', country: 'Angola', isForeigner: false }
  })
  const [form, setForm] = useState(emptyForm)

  const { data: reservations = [], isLoading, refetch } = useQuery({
    queryKey: ['reservations', currentUser?.id, isClient],
    queryFn: async () => {
      const response = isClient ? await reservationsApi.getMine() : await reservationsApi.list()
      return response.data
    },
    enabled: !!currentUser,
  })

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsApi.list().then(r => r.data)
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
    enabled: isStaff
  })

  const availableRooms = rooms.filter((r: any) => r.state === 'VACANT_CLEAN')
  const selectedRoom = rooms.find((r: any) => r.id === form.roomId)

  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0
    const diff = new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()
    return diff > 0 ? Math.ceil(diff / 86_400_000) : 0
  })()
  const totalPrice = selectedRoom ? selectedRoom.pricePerNight * nights : 0

  const canProceedToGuestData = !!(form.roomId && form.checkIn && form.checkOut && nights > 0)
  const canProceedToReview = !!(form.guest.name && form.guest.email && form.guest.phone && form.guest.idDocument)

  useEffect(() => {
    if (roomIdFromUrl) {
      setForm(prev => ({ ...prev, roomId: roomIdFromUrl }))
      setIsWalkIn(!isStaff)
      setShowCreate(true)
      setCurrentStep('select-room')
      setSearchParams({}, { replace: true })
    }
  }, [roomIdFromUrl, isStaff, setSearchParams])

  const createMutation = useMutation({
    mutationFn: () => reservationsApi.create({
      roomId: form.roomId,
      checkIn: new Date(form.checkIn).toISOString(),
      checkOut: new Date(form.checkOut).toISOString(),
      userId: isStaff && !isWalkIn ? form.userId : currentUser?.id,
      guest: { ...form.guest, isForeigner: form.guest.country !== 'Angola' },
      adults: parseInt(form.adults),
      children: parseInt(form.children),
      notes: form.notes,
    }),
    onSuccess: () => {
      refetch()
      setShowCreate(false)
      setForm(emptyForm())
      setCurrentStep('select-room')
      toast.success('Reserva registada com sucesso!')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro ao criar reserva'),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action, data }: { id: string; action: string; data?: any }) => {
      const map: Record<string, () => any> = {
        pay: () => reservationsApi.pay(id, data?.method || 'CASH'),
        checkin: () => reservationsApi.checkIn(id),
        checkout: () => reservationsApi.checkOut(id),
      }
      return map[action]()
    },
    onSuccess: (_, { action }) => {
      refetch()
      const msgs: Record<string, string> = {
        pay: 'Pagamento confirmado!',
        checkin: 'Check-in efetuado!',
        checkout: 'Check-out concluído!',
      }
      toast.success(msgs[action] ?? 'Operação concluída')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Erro na operação'),
  })

  const countByStatus = (reservations as any[]).reduce((acc: Record<string, number>, r: any) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const filtered = (reservations as any[]).filter((r: any) => {
    const mapTab = tab === 'all' || r.status === tab
    const q = search.trim().toLowerCase()
    const mapSearch = !q
      || r.guest?.name?.toLowerCase().includes(q)
      || r.user?.name?.toLowerCase().includes(q)
      || r.room?.number?.toString().includes(q)
      || r.guest?.phone?.includes(q)
      || r.guest?.idDocument?.toLowerCase().includes(q)
    return mapTab && mapSearch
  })

  const stepIndex = STEPS.indexOf(currentStep)
  const avatarColors = ['bg-indigo-100 text-indigo-700', 'bg-teal-100 text-teal-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-700']

  if (isLoading) return <PageSpinner />
  if (!currentUser) return <div className="p-8 text-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {!showCreate ? (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fadeIn">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-widest text-amber-600 uppercase mb-1">{isStaff ? 'Painel de Gestão' : 'Área do Hóspede'}</p>
              <h1 className="text-3xl font-serif font-bold text-[#001E3D] leading-tight">{isStaff ? 'Reservas' : 'Minhas Reservas'}</h1>
              <p className="text-sm text-slate-400 mt-1">{filtered.length} de {(reservations as any[]).length} reserva(s)</p>
            </div>
            <button onClick={() => { setIsWalkIn(!isStaff); setShowCreate(true); setCurrentStep('select-room') }} className="flex items-center gap-2 bg-[#001E3D] hover:bg-[#002d5c] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all">
              <Plus size={15} /> {isStaff ? 'Nova Reserva' : 'Reservar Quarto'}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#001E3D] focus:outline-none focus:ring-2 focus:ring-[#001E3D]/10 transition-all placeholder:text-slate-300" placeholder={isStaff ? 'Nome, quarto, telefone, BI…' : 'Pesquisar reservas…'} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_TABS.map(t => {
                  const count = t.value === 'all' ? (reservations as any[]).length : (countByStatus[t.value] ?? 0)
                  return (
                    <button key={t.value} onClick={() => setTab(t.value)} className={cn('px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border', tab === t.value ? 'bg-[#001E3D] border-[#001E3D] text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700')}>
                      {t.label} {count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{count}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="mx-auto text-slate-300 mb-3" size={36} />
                <h3 className="text-sm font-bold text-slate-700">Nenhuma reserva encontrada</h3>
                <button onClick={() => setShowCreate(true)} className="mt-3 px-3 py-1.5 bg-[#001E3D] text-white rounded-lg text-xs font-semibold">{isStaff ? 'Criar Reserva' : 'Solicitar Quarto'}</button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hóspede</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quarto</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-in</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Check-out</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r: any, i: number) => {
                    const name = r.guest?.name ?? r.user?.name ?? 'Hóspede'
                    return (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => setSelectedRes(r)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', avatarColors[i % avatarColors.length])}>{name.charAt(0).toUpperCase()}</div>
                            <p className="text-sm font-semibold text-slate-800">{name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 font-medium">#{r.room?.number}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.checkIn)}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.checkOut)}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#001E3D]">{formatCurrency(r.totalPrice)}</td>
                        <td className="px-5 py-4"><StatusPill status={r.status} /></td>
                        <td className="px-5 py-4"><ChevronRight size={15} className="text-slate-300 group-hover:text-[#001E3D]" /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-50 bg-[#F8F7F4] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
            <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#001E3D] rounded-xl flex items-center justify-center flex-shrink-0"><Home size={17} className="text-white" /></div>
                <div><p className="text-xs font-black tracking-widest text-amber-600 uppercase">Nova Reserva</p><p className="text-sm font-semibold text-[#001E3D]">{STEP_LABELS[stepIndex]}</p></div>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors"><X size={18} className="text-slate-500" /></button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-5 py-8">
            {currentStep === 'select-room' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100"><BedDouble size={16} className="text-[#001E3D]" /><h3 className="font-serif font-bold text-slate-800 text-base">Escolha o quarto</h3></div>
                  <Field label="Quarto disponível *">
                    <select className={inputCls(false) + ' pl-3'} value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}>
                      <option value="">Selecione um quarto…</option>
                      {availableRooms.map((r: any) => (<option key={r.id} value={r.id}>Quarto {r.number} — {r.type} · {formatCurrency(r.pricePerNight)}/noite · {r.capacity} hóspedes</option>))}
                    </select>
                  </Field>
                  {selectedRoom && (<div className="flex gap-4 p-4 bg-[#001E3D]/5 rounded-xl border border-[#001E3D]/10 mt-1"><div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200"><img src={selectedRoom.imageUrl?.startsWith('http') ? selectedRoom.imageUrl : `https://placehold.co/120x120/001E3D/FFFFFF?text=${selectedRoom.number}`} alt="Quarto" className="w-full h-full object-cover" /></div><div className="flex-1"><p className="font-serif font-bold text-[#001E3D] text-base">{selectedRoom.title || `Quarto ${selectedRoom.number}`}</p><p className="text-xs text-slate-500 mt-0.5">{selectedRoom.type}</p><p className="text-lg font-black text-[#001E3D] mt-2 font-serif">{formatCurrency(selectedRoom.pricePerNight)}<span className="text-xs font-normal text-slate-400">/noite</span></p></div></div>)}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100"><Calendar size={16} className="text-[#001E3D]" /><h3 className="font-serif font-bold text-slate-800 text-base">Período da estadia</h3></div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Check-in *"><input type="date" className={inputCls(false) + ' pl-3'} min={new Date().toISOString().split('T')[0]} value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} /></Field>
                    <Field label="Check-out *"><input type="date" className={inputCls(false) + ' pl-3'} min={form.checkIn || new Date().toISOString().split('T')[0]} value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} /></Field>
                  </div>
                  {nights > 0 && selectedRoom && (<div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200"><div className="flex items-center gap-2"><Moon size={16} className="text-amber-600" /><span className="text-sm font-semibold text-slate-700">{nights} {nights === 1 ? 'noite' : 'noites'}</span><span className="text-xs text-slate-400">· {formatDate(form.checkIn)} → {formatDate(form.checkOut)}</span></div><p className="text-lg font-black text-[#001E3D] font-serif">{formatCurrency(totalPrice)}</p></div>)}
                </div>

                <div className="flex justify-end"><button disabled={!canProceedToGuestData} onClick={() => setCurrentStep('guest-data')} className="flex items-center gap-2 bg-[#001E3D] hover:bg-[#002d5c] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-40">Continuar <ArrowRight size={15} /></button></div>
              </div>
            )}

            {currentStep === 'guest-data' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100"><User size={16} className="text-[#001E3D]" /><h3 className="font-serif font-bold text-slate-800 text-base">Dados do hóspede</h3></div>
                  {isStaff && !isWalkIn && (<Field label="Conta de cliente registado"><select className={inputCls(false) + ' pl-3'} value={form.userId} onChange={e => { const u = users.find((u: any) => u.id === e.target.value); setForm(f => ({ ...f, userId: e.target.value, guest: { ...f.guest, name: u?.name ?? '', email: u?.email ?? '' } })) }}><option value="">Selecionar cliente…</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}</select></Field>)}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nome completo *" icon={User} className="sm:col-span-2"><input className={inputCls()} value={form.guest.name} placeholder="Nome do hóspede" onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, name: e.target.value } }))} /></Field>
                    <Field label="Email *" icon={Mail}><input className={inputCls()} type="email" value={form.guest.email} placeholder="email@exemplo.com" onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, email: e.target.value } }))} /></Field>
                    <Field label="Telefone *" icon={Phone}><input className={inputCls()} value={form.guest.phone} placeholder="+244 9xx xxx xxx" onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, phone: e.target.value } }))} /></Field>
                    <Field label="Documento (BI/Passaporte) *" icon={FileText}><input className={inputCls()} value={form.guest.idDocument} placeholder="Nº do documento" onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, idDocument: e.target.value } }))} /></Field>
                    <Field label="Província" icon={MapPin}><input className={inputCls()} value={form.guest.province} placeholder="Luanda" onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, province: e.target.value } }))} /></Field>
                    <Field label="País" className="sm:col-span-2"><select className={inputCls(false) + ' pl-3'} value={form.guest.country} onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, country: e.target.value } }))}><option value="Angola">Angola</option><option value="Portugal">Portugal</option><option value="Brasil">Brasil</option><option value="Outro">Outro</option></select></Field>
                  </div>
                </div>
                <div className="flex justify-between"><button onClick={() => setCurrentStep('select-room')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"><ChevronLeft size={15} /> Voltar</button><button disabled={!canProceedToReview} onClick={() => setCurrentStep('review')} className="flex items-center gap-2 bg-[#001E3D] hover:bg-[#002d5c] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-40">Continuar <ArrowRight size={15} /></button></div>
              </div>
            )}

            {currentStep === 'review' && selectedRoom && (
              <div className="space-y-5 animate-fadeIn">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100"><Sparkles size={16} className="text-[#001E3D]" /><h3 className="font-serif font-bold text-slate-800 text-base">Resumo da reserva</h3></div>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4"><div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200"><img src={selectedRoom.imageUrl?.startsWith('http') ? selectedRoom.imageUrl : `https://placehold.co/80x80/001E3D/FFFFFF?text=${selectedRoom.number}`} alt="Quarto" className="w-full h-full object-cover" /></div><div><p className="font-serif font-bold text-[#001E3D]">{selectedRoom.title || `Quarto ${selectedRoom.number}`}</p><p className="text-xs text-slate-400">{selectedRoom.type}</p></div></div>
                  <div className="space-y-2.5">
                    {[['Período', `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)}`], ['Duração', `${nights} ${nights === 1 ? 'noite' : 'noites'}`], ['Diária', formatCurrency(selectedRoom.pricePerNight)]].map(([k, v]) => (<div key={k} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-700">{v}</span></div>))}
                    <div className="flex justify-between items-center pt-1"><span className="font-semibold text-[#001E3D]">Total</span><span className="text-2xl font-black text-[#001E3D] font-serif">{formatCurrency(totalPrice)}</span></div>
                  </div>
                </div>
                <div className="flex justify-between"><button onClick={() => setCurrentStep('guest-data')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"><ChevronLeft size={15} /> Voltar</button><button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-7 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all">{createMutation.isPending ? 'A processar…' : <><CheckCircle size={15} /> Confirmar Reserva</>}</button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedRes && (
        <ReservationDetailPanel
          reservation={selectedRes}
          isStaff={isStaff}
          isClient={isClient}
          onClose={() => setSelectedRes(null)}
          onAction={(id: string, act: string, data?: any) => actionMutation.mutate({ id, action: act, data })}
          refetch={refetch}
        />
      )}

      <ConfirmDialog 
        isOpen={!!cancelId} 
        title="Cancelar Reserva" 
        description="Tem a certeza que deseja cancelar esta reserva?" 
        onConfirm={() => cancelId && actionMutation.mutate({ id: cancelId, action: 'cancel' })} 
        onClose={() => setCancelId(null)} 
      />
    </div>
  )
}