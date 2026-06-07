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
  DollarSign, StickyNote, Upload, Link, AlertCircle, Edit2
} from 'lucide-react'
import { formatDate, formatCurrency, cn } from '@/utils'
import type { ReservationStatus } from '@/types'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

type FormStep = 'select-room' | 'guest-data' | 'review'

const STATUS_META: Record<string, { label: string; dot: string; pill: string }> = {
  pending:     { label: 'Pendente',   dot: '#D97706', pill: 'bg-amber-50  text-amber-700  border-amber-200'   },
  confirmed:   { label: 'Confirmada', dot: '#059669', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_in:  { label: 'Check-in',   dot: '#2563EB', pill: 'bg-blue-50   text-blue-700   border-blue-200'    },
  checked_out: { label: 'Check-out',  dot: '#64748B', pill: 'bg-slate-100 text-slate-600  border-slate-200'   },
  cancelled:   { label: 'Cancelada',  dot: '#DC2626', pill: 'bg-red-50    text-red-700    border-red-200'     },
  expired:     { label: 'Expirada',   dot: '#9CA3AF', pill: 'bg-gray-100  text-gray-500   border-gray-200'    },
  completed:   { label: 'Concluída',  dot: '#16A34A', pill: 'bg-green-50  text-green-700  border-green-200'   },
}

const STATUS_TABS: { label: string; value: ReservationStatus | 'all' }[] = [
  { label: 'Todas',      value: 'all'       },
  { label: 'Pendentes',  value: 'pending'   },
  { label: 'Confirmadas',value: 'confirmed' },
  { label: 'Check-in',   value: 'checked_in' },
  { label: 'Check-out',  value: 'checked_out' },
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

/* ─────────────── COMPONENTE EDITAR DATAS COM RECÁLCULO ─────────────── */
function EditDatesForm({ reservation, onClose, onSuccess, onAction }: { 
  reservation: any; 
  onClose: () => void; 
  onSuccess: () => void;
  onAction: (id: string, action: string, data?: any) => void;
}) {
  const [checkIn, setCheckIn] = useState(reservation.checkIn?.split('T')[0] || '')
  const [checkOut, setCheckOut] = useState(reservation.checkOut?.split('T')[0] || '')
  const [loading, setLoading] = useState(false)
  const [showPaymentInfo, setShowPaymentInfo] = useState(false)

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
  const needsExtraPayment = difference > 0

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

    if (checkInDate < new Date()) {
      toast.error('Check-in não pode ser no passado')
      return
    }

    if (newNights === originalNights) {
      setLoading(true)
      try {
        await reservationsApi.update(reservation.id, {
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString()
        })
        toast.success('Datas atualizadas com sucesso!')
        onSuccess()
        onClose()
      } catch (error: any) {
        toast.error(error.response?.data?.message ?? 'Erro ao atualizar datas')
      } finally {
        setLoading(false)
      }
    } else {
      setShowPaymentInfo(true)
    }
  }

  const handleConfirmWithPayment = async () => {
    setLoading(true)
    try {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      
      await reservationsApi.update(reservation.id, {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString()
      })
      
      if (needsExtraPayment && difference > 0) {
        toast.success(`Datas atualizadas! Valor adicional de ${formatCurrency(difference)} será processado.`)
      } else if (difference < 0) {
        toast.info(`Datas atualizadas! Crédito de ${formatCurrency(Math.abs(difference))} será reembolsado.`)
      } else {
        toast.success('Datas atualizadas com sucesso!')
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Erro ao atualizar reserva')
    } finally {
      setLoading(false)
    }
  }

  if (showPaymentInfo) {
    return (
      <div className="bg-white rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <DollarSign size={16} className="text-[#001E3D]" />
          <h3 className="text-sm font-bold text-[#001E3D]">Resumo da Alteração</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Período original:</span>
            <span className="font-medium">
              {formatDate(reservation.checkIn)} → {formatDate(reservation.checkOut)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Valor original:</span>
            <span className="font-medium">{formatCurrency(originalTotal)}</span>
          </div>
          
          <div className="border-t border-slate-100 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Novo período:</span>
              <span className="font-medium">
                {formatDate(checkIn)} → {formatDate(checkOut)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-500">Noites:</span>
              <span className="font-medium">{newNights} {newNights === 1 ? 'noite' : 'noites'}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-500">Novo valor:</span>
              <span className="font-medium">{formatCurrency(newTotal)}</span>
            </div>
          </div>

          <div className={cn('p-3 rounded-lg', needsExtraPayment ? 'bg-amber-50' : 'bg-emerald-50')}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">
                {needsExtraPayment ? 'Valor adicional a pagar:' : 'Valor a ser reembolsado:'}
              </span>
              <span className={cn('text-lg font-bold', needsExtraPayment ? 'text-amber-600' : 'text-emerald-600')}>
                {formatCurrency(Math.abs(difference))}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setShowPaymentInfo(false)}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Voltar
          </button>
          <button
            onClick={handleConfirmWithPayment}
            disabled={loading}
            className="flex-1 bg-[#001E3D] hover:bg-[#002d5c] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'A processar...' : 'Confirmar Alteração'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Calendar size={16} className="text-[#001E3D]" />
        <h3 className="text-sm font-bold text-[#001E3D]">Alterar Datas da Reserva</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Check-in
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#001E3D] focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Check-out
          </label>
          <input
            type="date"
            min={checkIn}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-[#001E3D] focus:outline-none text-sm"
          />
        </div>
      </div>

      {(checkIn !== reservation.checkIn?.split('T')[0] || checkOut !== reservation.checkOut?.split('T')[0]) && (
        <div className="bg-amber-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Noites:</span>
            <span className="font-semibold">{newNights} {newNights === 1 ? 'noite' : 'noites'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Novo total:</span>
            <span className="font-bold text-[#001E3D]">{formatCurrency(newTotal)}</span>
          </div>
          {newNights !== originalNights && (
            <div className="text-xs text-slate-500 pt-1 border-t border-amber-200">
              {newNights > originalNights ? (
                <span className="text-amber-600">⚠️ Valor aumentará em {formatCurrency(difference)}</span>
              ) : (
                <span className="text-emerald-600">✓ Valor diminuirá em {formatCurrency(Math.abs(difference))}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !checkIn || !checkOut}
          className="flex-1 bg-[#001E3D] hover:bg-[#002d5c] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'A guardar...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}


/* ─────────────── DETAIL PANEL ─────────────── */
function ReservationDetailPanel({ reservation: r, onClose, isStaff, isClient, onAction, onCancel, refetch }: {
  reservation: any; onClose: () => void; isStaff: boolean; isClient: boolean
  onAction: (id: string, action: string, data?: any) => void; onCancel: (id: string) => void;
  refetch: () => void;
}) {
  const name = r.guest?.name ?? r.user?.name ?? 'Hóspede'
  const [showProofUpload, setShowProofUpload] = useState(false)
  const [showEditDates, setShowEditDates] = useState(false)
  const [showPaymentMethod, setShowPaymentMethod] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  
  
  const nights = (() => {
    const diff = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()
    return diff > 0 ? Math.ceil(diff / 86_400_000) : 0
  })()

  // CORRIGIDO: Verificar se o check-in pode ser feito
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const checkInDate = new Date(r.checkIn)
  checkInDate.setHours(0, 0, 0, 0)
  
  // Verificar se hoje é igual ou depois da data de check-in
  const isCheckInDay = checkInDate.getTime() <= today.getTime()
  const canCheckIn = r.status === 'CONFIRMED' && isCheckInDay
  
  // Verificar se o check-out pode ser feito
  const canCheckOut = r.status === 'CHECKED_IN'

  // Verificar se tem comprovativo para análise
  const hasProof = !!r.paymentProofUrl

  // Formatar data para exibição
  const formattedCheckInDate = formatDate(r.checkIn)
  console.log('=== DADOS DA RESERVA PARA CHECK-IN ===')
console.log('ID:', r.id)
console.log('Status:', r.status)
console.log('PaymentStatus:', r.paymentStatus)
console.log('ExpiresAt:', r.expiresAt)
console.log('CheckIn:', r.checkIn)
console.log('Hoje:', new Date().toISOString())

  const handleConfirmPayment = () => {
    setShowPaymentMethod(true)
  }

  const handlePaymentConfirm = () => {
    onAction(r.id, 'pay', { method: paymentMethod })
    setShowPaymentMethod(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* panel header */}
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

        {/* stay strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 flex-shrink-0">
          {[
            { label: 'Check-in',  value: formatDate(r.checkIn)  },
            { label: 'Check-out', value: formatDate(r.checkOut) },
            { label: 'Noites',    value: `${nights}n`            },
          ].map(({ label, value }) => (
            <div key={label} className="px-3 py-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        {/* scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {/* financial */}
            <PanelSection title="Financeiro" icon={DollarSign}>
              <DR label="Diária"  value={formatCurrency(r.room?.pricePerNight ?? 0)} />
              <DR label="Noites"  value={`× ${nights}`} />
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-1">
                <span className="text-sm font-bold text-[#001E3D]">Total</span>
                <span className="text-xl font-black text-[#001E3D] font-serif">{formatCurrency(r.totalPrice)}</span>
              </div>
              {r.paymentProofUrl && (
                <div className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle size={13} /> Comprovativo Anexado
                  </span>
                  <a href={r.paymentProofUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-emerald-600 hover:underline">
                    Visualizar Anexo
                  </a>
                </div>
              )}
            </PanelSection>

            {/* Botão para editar datas (apenas para clientes com reserva pending) */}
            {isClient && r.status === 'PENDING' && (
              <div>
                <button
                  onClick={() => setShowEditDates(true)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Edit2 size={14} /> Alterar Datas da Reserva
                </button>
              </div>
            )}

            {/* upload for client inside the panel */}
            {isClient && r.status === 'PENDING' && !r.paymentProofUrl && (
              <div className="space-y-2">
                {!showProofUpload ? (
                  <button 
                    onClick={() => setShowProofUpload(true)}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Upload size={14} /> Anexar Comprovativo Bancário
                  </button>
                ) : (
                  <PaymentProofForm reservationId={r.id} onProofUploaded={() => setShowProofUpload(false)} />
                )}
              </div>
            )}

            {/* Mensagem para cliente quando comprovativo já foi enviado */}
            {isClient && r.status === 'PENDING' && r.paymentProofUrl && (
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <p className="text-xs text-blue-700">
                  <CheckCircle size={12} className="inline mr-1" />
                  Seu comprovativo foi enviado. Aguarde a confirmação do pagamento.
                </p>
              </div>
            )}

            {/* guest */}
            <PanelSection title="Hóspede" icon={User}>
              <DR label="Nome"      value={name} />
              <DR label="Email"     value={r.guest?.email ?? r.user?.email ?? '—'} />
              <DR label="Telefone"  value={r.guest?.phone ?? r.user?.phone ?? '—'} />
              <DR label="Documento" value={r.guest?.idDocument ?? '—'} />
              {r.guest?.province && <DR label="Província" value={r.guest.province} />}
              <DR label="País"      value={r.guest?.country ?? '—'} />
            </PanelSection>

            {/* room */}
            <PanelSection title="Quarto" icon={BedDouble}>
              <DR label="Número"     value={`#${r.room?.number}`} />
              <DR label="Tipo"       value={r.room?.type ?? '—'} />
              <DR label="Capacidade" value={`${r.room?.capacity ?? '—'} hóspedes`} />
              {r.adults    != null && <DR label="Adultos"  value={r.adults}   />}
              {r.children  != null && <DR label="Crianças" value={r.children} />}
            </PanelSection>

            {r.notes && (
              <PanelSection title="Observações" icon={StickyNote}>
                <p className="text-sm text-slate-600 leading-relaxed">{r.notes}</p>
              </PanelSection>
            )}

            <PanelSection title="Registo" icon={Clock}>
              {r.createdAt && <DR label="Criada em"   value={formatDate(r.createdAt)} />}
              {r.updatedAt && <DR label="Atualizada"  value={formatDate(r.updatedAt)} />}
            </PanelSection>
          </div>
        </div>

        {/* action footer - STAFF */}
        {isStaff && (
          <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0 bg-slate-50/80">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ações Administrativas</p>
            <div className="flex flex-wrap gap-2">
              {/* Confirmar Pagamento */}
              {r.status === 'PENDING' && (
                <PanelActionBtn color="emerald" icon={<CreditCard size={13} />}
                  onClick={handleConfirmPayment}>
                  Confirmar Pagamento
                </PanelActionBtn>
              )}
              
              {/* Fazer Check-in - CORRIGIDO */}
              {r.status === 'CONFIRMED' && (
                <PanelActionBtn 
                  color={canCheckIn ? "blue" : "gray"} 
                  icon={<LogIn size={13} />}
                  onClick={() => { 
                    if (canCheckIn) {
                      onAction(r.id, 'checkin'); 
                      onClose();
                    } else {
                      toast.error(`Check-in permitido apenas a partir de ${formattedCheckInDate}`);
                    }
                  }}
                  disabled={!canCheckIn}
                >
                  {canCheckIn ? 'Fazer Check-in' : `Check-in disponível em ${formattedCheckInDate}`}
                </PanelActionBtn>
              )}
              
              {/* Fazer Check-out */}
              {r.status === 'CHECKED_IN' && (
                <PanelActionBtn color="orange" icon={<LogOut size={13} />}
                  onClick={() => { onAction(r.id, 'checkout'); onClose() }}>
                  Fazer Check-out
                </PanelActionBtn>
              )}
              
              {/* Cancelar Reserva */}
              {['PENDING', 'CONFIRMED'].includes(r.status) && (
                <PanelActionBtn color="red" icon={<X size={13} />}
                  onClick={() => { onCancel(r.id); onClose() }}>
                  Cancelar Reserva
                </PanelActionBtn>
              )}
            </div>
            
            {/* Informação adicional sobre check-in */}
            {r.status === 'CONFIRMED' && !canCheckIn && (
              <p className="text-xs text-slate-400 mt-3 text-center">
                ⚠️ O check-in só pode ser realizado a partir de {formattedCheckInDate}.
              </p>
            )}
            
            {/* Informação sobre comprovativo pendente */}
            {r.status === 'PENDING' && r.paymentProofUrl && (
              <p className="text-xs text-amber-600 mt-3 text-center">
                📎 Comprovativo anexado. Verifique antes de confirmar pagamento.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de seleção de método de pagamento */}
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
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="w-4 h-4 text-[#001E3D]"
                    />
                    <span className="text-sm font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50" onClick={() => setShowPaymentMethod(false)}>
                Cancelar
              </button>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium" onClick={handlePaymentConfirm}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de datas */}
      {showEditDates && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <EditDatesForm 
              reservation={r} 
              onClose={() => setShowEditDates(false)} 
              onSuccess={() => {
                refetch()
                setShowEditDates(false)
              }} 
              onAction={onAction}
            />
          </div>
        </div>
      )}
    </>
  )
}

function PanelSection({ title, icon: Icon, children }: any) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Icon size={12} className="text-slate-400" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function DR({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-700 text-right break-all">{value}</span>
    </div>
  )
}

function PanelActionBtn({ children, color, icon, onClick, disabled = false }: any) {
  const cls: Record<string, string> = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    blue:    'bg-blue-600    hover:bg-blue-700    text-white',
    orange:  'bg-orange-500  hover:bg-orange-600  text-white',
    red:     'bg-red-50       hover:bg-red-100     text-red-700 border border-red-200',
    gray:    'bg-gray-300     cursor-not-allowed    text-gray-500',
  }
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all', cls[color])}
    >
      {icon}{children}
    </button>
  )
}

function EmptyState({ search, tab, isStaff, onClear, onNew }: any) {
  return (
    <div className="p-12 text-center">
      <Calendar className="mx-auto text-slate-300 mb-3" size={36} />
      <h3 className="text-sm font-bold text-slate-700">Nenhuma reserva encontrada</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        {search || tab !== 'all' ? 'Tente ajustar os critérios de pesquisa ou limpar os filtros ativos.' : 'Ainda não existem registos de reservas sob este perfil.'}
      </p>
      <div className="flex justify-center gap-2 mt-4">
        {(search || tab !== 'all') && (
          <button onClick={onClear} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white">Limpar Filtros</button>
        )}
        <button onClick={onNew} className="px-3 py-1.5 bg-[#001E3D] text-white rounded-lg text-xs font-semibold">{isStaff ? 'Criar Reserva' : 'Solicitar Quarto'}</button>
      </div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Icon size={16} className="text-[#001E3D]" />
        <h3 className="font-serif font-bold text-slate-800 text-base">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function StepBtn({ children, onClick, disabled }: any) {
  return (
    <button disabled={disabled} onClick={onClick} className="flex items-center gap-2 bg-[#001E3D] hover:bg-[#002d5c] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-40">
      {children}
    </button>
  )
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */
export default function ReservationsPage() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const roomIdFromUrl = searchParams.get('roomId')

  const { user: currentUser } = useAuthStore()
  const isStaff  = ['ADMIN', 'MANAGER', 'RECEPTION'].includes(currentUser?.role ?? '')
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

  useEffect(() => {
    if (roomIdFromUrl) {
      setForm(prev => ({ ...prev, roomId: roomIdFromUrl }))
      setIsWalkIn(!isStaff)
      setShowCreate(true)
      setCurrentStep('select-room')
      setSearchParams({}, { replace: true })
    }
  }, [roomIdFromUrl, isStaff, setSearchParams])

  /* queries */
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
  const selectedRoom   = rooms.find((r: any) => r.id === form.roomId)

  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0
    const diff = new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()
    return diff > 0 ? Math.ceil(diff / 86_400_000) : 0
  })()
  const totalPrice = selectedRoom ? selectedRoom.pricePerNight * nights : 0

  const canProceedToGuestData = !!(form.roomId && form.checkIn && form.checkOut && nights > 0)
  const canProceedToReview    = !!(form.guest.name && form.guest.email && form.guest.phone && form.guest.idDocument)

  /* mutations */
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
      cancel: () => reservationsApi.cancel(id),
    }
    return map[action]()
  },
  onSuccess: (_, { action }) => {
    refetch()
    const msgs: Record<string, string> = { 
      pay: 'Pagamento confirmado!', 
      checkin: 'Check-in efetuado!', 
      checkout: 'Check-out concluído!', 
      cancel: 'Reserva cancelada.' 
    }
    toast.success(msgs[action] ?? 'Operação concluída')
    setCancelId(null)
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
  const avatarColors = ['bg-indigo-100 text-indigo-700','bg-teal-100 text-teal-700','bg-rose-100 text-rose-700','bg-amber-100 text-amber-700','bg-violet-100 text-violet-700','bg-cyan-100 text-cyan-700']

  if (isLoading) return <PageSpinner />

  return (
    <div className="min-h-screen bg-[#F8F7F4]">

      {/* ═══════ LIST ═══════ */}
      {!showCreate && (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fadeIn">
          {/* header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-widest text-amber-600 uppercase mb-1">
                {isStaff ? 'Painel de Gestão' : 'Área do Hóspede'}
              </p>
              <h1 className="text-3xl font-serif font-bold text-[#001E3D] leading-tight">
                {isStaff ? 'Reservas' : 'Minhas Reservas'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {filtered.length} de {(reservations as any[]).length} reserva(s)
              </p>
            </div>
            <button
              onClick={() => { setIsWalkIn(!isStaff); setShowCreate(true); setCurrentStep('select-room') }}
              className="flex items-center gap-2 bg-[#001E3D] hover:bg-[#002d5c] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
            >
              <Plus size={15} /> {isStaff ? 'Nova Reserva' : 'Reservar Quarto'}
            </button>
          </div>

          {/* filter bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#001E3D] focus:outline-none focus:ring-2 focus:ring-[#001E3D]/10 transition-all placeholder:text-slate-300"
                  placeholder={isStaff ? 'Nome, quarto, telefone, BI…' : 'Pesquisar reservas…'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {STATUS_TABS.map(t => {
                  const count = t.value === 'all' ? (reservations as any[]).length : (countByStatus[t.value] ?? 0)
                  const isActive = tab === t.value
                  return (
                    <button key={t.value} onClick={() => setTab(t.value)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                        isActive ? 'bg-[#001E3D] border-[#001E3D] text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      )}>
                      {t.label} {count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{count}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

         {/* desktop table */}
<div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
  {filtered.length === 0 ? (
    <EmptyState 
      search={search} 
      tab={tab} 
      isStaff={isStaff} 
      onClear={() => { setTab('all'); setSearch('') }} 
      onNew={() => setShowCreate(true)} 
    />
  ) : (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/60">
          {['Hóspede', 'Quarto', 'Check-in', 'Check-out', 'Total', 'Estado', 'Ação', ''].map(h => (
            <th key={h} className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filtered.map((r: any, i: number) => {
          const name = r.guest?.name ?? r.user?.name ?? 'Hóspede'
          return (
            <React.Fragment key={r.id}>
              <tr className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                <td className="px-5 py-4" onClick={() => setSelectedRes(r)}>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', avatarColors[i % avatarColors.length])}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-[#001E3D] transition-colors">{name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600 font-medium" onClick={() => setSelectedRes(r)}>#{r.room?.number}</td>
                <td className="px-5 py-4 text-sm text-slate-500" onClick={() => setSelectedRes(r)}>{formatDate(r.checkIn)}</td>
                <td className="px-5 py-4 text-sm text-slate-500" onClick={() => setSelectedRes(r)}>{formatDate(r.checkOut)}</td>
                <td className="px-5 py-4 text-sm font-bold text-[#001E3D]" onClick={() => setSelectedRes(r)}>{formatCurrency(r.totalPrice)}</td>
                <td className="px-5 py-4" onClick={() => setSelectedRes(r)}><StatusPill status={r.status} /></td>
                
                {/* Coluna de Upload para Cliente */}
                <td className="px-5 py-4">
                  {isClient && r.status === 'PENDING' && !r.paymentProofUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadingInlineId(uploadingInlineId === r.id ? null : r.id) }}
                      className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Upload size={12} /> Comprovativo
                    </button>
                  )}
                  {r.paymentProofUrl && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Enviado
                    </span>
                  )}
                </td>
                
                {/* Botão Editar Datas */}
                <td className="px-5 py-4">
                  {isClient && r.status === 'PENDING' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRes(r); setTimeout(() => setShowEditDates(true), 100) }}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Alterar Datas"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </td>
                
                <td className="px-5 py-4" onClick={() => setSelectedRes(r)}>
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-[#001E3D] ml-auto" />
                </td>
              </tr>

              {/* Linha inline para upload rápido */}
              {uploadingInlineId === r.id && (
                <tr>
                  <td colSpan={8} className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
                    <div className="max-w-xl">
                      <PaymentProofForm reservationId={r.id} onProofUploaded={() => setUploadingInlineId(null)} />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          )
        })}
      </tbody>
    </table>
  )}
</div>

          {/* mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r: any, i: number) => {
              const name = r.guest?.name ?? r.user?.name ?? 'Hóspede'
              return (
                <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start" onClick={() => setSelectedRes(r)}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold', avatarColors[i % avatarColors.length])}>
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{name}</p>
                        <p className="text-xs text-slate-400">Quarto #{r.room?.number}</p>
                      </div>
                    </div>
                    <StatusPill status={r.status} />
                  </div>

                  {/* Ação de Comprovativo no Mobile */}
                  {isClient && r.status === 'PENDING' && (
                    <div className="pt-1 border-t border-slate-100">
                      {r.paymentProofUrl ? (
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 p-2 rounded-lg">
                          <CheckCircle size={13} /> Comprovativo já submetido
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {uploadingInlineId !== r.id ? (
                            <button
                              onClick={() => setUploadingInlineId(r.id)}
                              className="w-full flex items-center justify-center gap-1.5 bg-amber-600 text-white text-xs font-bold uppercase py-2 rounded-xl"
                            >
                              <Upload size={13} /> Enviar Comprovativo Bancário
                            </button>
                          ) : (
                            <PaymentProofForm reservationId={r.id} onProofUploaded={() => setUploadingInlineId(null)} />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CREATE OVERLAY */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-[#F8F7F4] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
            <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#001E3D] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Home size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-widest text-amber-600 uppercase">Nova Reserva</p>
                  <p className="text-sm font-semibold text-[#001E3D]">{STEP_LABELS[stepIndex]}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <div key={s} className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i < stepIndex  ? 'w-8 bg-[#001E3D]' : i === stepIndex ? 'w-12 bg-amber-500' : 'w-8 bg-slate-200'
                  )} />
                ))}
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-5 py-8">
            {/* STEP 1 */}
            {currentStep === 'select-room' && (
              <div className="space-y-5 animate-fadeIn">
                <SectionCard title="Escolha o quarto" icon={BedDouble}>
                  <Field label="Quarto disponível *">
                    <select
                      className={inputCls(false) + ' pl-3'}
                      value={form.roomId}
                      onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
                    >
                      <option value="">Selecione um quarto…</option>
                      {availableRooms.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          Quarto {r.number} — {r.type} · {formatCurrency(r.pricePerNight)}/noite · {r.capacity} hóspedes
                        </option>
                      ))}
                    </select>
                  </Field>

                  {selectedRoom && (
                    <div className="flex gap-4 p-4 bg-[#001E3D]/5 rounded-xl border border-[#001E3D]/10 mt-1">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                        <img
                          src={selectedRoom.imageUrl?.startsWith('http') ? selectedRoom.imageUrl : `https://placehold.co/120x120/001E3D/FFFFFF?text=${selectedRoom.number}`}
                          alt="Quarto"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-bold text-[#001E3D] text-base leading-tight">
                          {selectedRoom.title || `Quarto ${selectedRoom.number}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedRoom.type}</p>
                        <div className="flex gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Users size={11} /> {selectedRoom.capacity} hóspedes</span>
                          <span className="flex items-center gap-1"><MapPin size={11} /> Piso {selectedRoom.floor ?? '1'}</span>
                        </div>
                        <p className="text-lg font-black text-[#001E3D] mt-2 font-serif">
                          {formatCurrency(selectedRoom.pricePerNight)}<span className="text-xs font-normal text-slate-400">/noite</span>
                        </p>
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Período da estadia" icon={Calendar}>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Check-in *">
                      <input
                        type="date"
                        className={inputCls(false) + ' pl-3'}
                        min={new Date().toISOString().split('T')[0]}
                        value={form.checkIn}
                        onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                      />
                    </Field>
                    <Field label="Check-out *">
                      <input
                        type="date"
                        className={inputCls(false) + ' pl-3'}
                        min={form.checkIn || new Date().toISOString().split('T')[0]}
                        value={form.checkOut}
                        onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                      />
                    </Field>
                  </div>

                  {nights > 0 && selectedRoom && (
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Moon size={16} className="text-amber-600" />
                        <span className="text-sm font-semibold text-slate-700">{nights} {nights === 1 ? 'noite' : 'noites'}</span>
                        <span className="text-xs text-slate-400">· {formatDate(form.checkIn)} → {formatDate(form.checkOut)}</span>
                      </div>
                      <p className="text-lg font-black text-[#001E3D] font-serif">{formatCurrency(totalPrice)}</p>
                    </div>
                  )}
                </SectionCard>

                <div className="flex justify-end">
                  <StepBtn disabled={!canProceedToGuestData} onClick={() => setCurrentStep('guest-data')}>
                    Continuar <ArrowRight size={15} />
                  </StepBtn>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 'guest-data' && (
              <div className="space-y-5 animate-fadeIn">
                <SectionCard title="Dados do hóspede" icon={User}>
                  {isStaff && !isWalkIn && (
                    <Field label="Conta de cliente registado">
                      <select
                        className={inputCls(false) + ' pl-3'}
                        value={form.userId}
                        onChange={e => {
                          const u = users.find((u: any) => u.id === e.target.value)
                          setForm(f => ({
                            ...f, userId: e.target.value,
                            guest: { ...f.guest, name: u?.name ?? '', email: u?.email ?? '' }
                          }))
                        }}
                      >
                        <option value="">Selecionar cliente…</option>
                        {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                      </select>
                    </Field>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                    <Field label="Nome completo *" icon={User} className="sm:col-span-2">
                      <input className={inputCls()} value={form.guest.name} placeholder="Nome do hóspede"
                        onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, name: e.target.value } }))} />
                    </Field>
                    <Field label="Email *" icon={Mail}>
                      <input className={inputCls()} type="email" value={form.guest.email} placeholder="email@exemplo.com"
                        onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, email: e.target.value } }))} />
                    </Field>
                    <Field label="Telefone *" icon={Phone}>
                      <input className={inputCls()} value={form.guest.phone} placeholder="+244 9xx xxx xxx"
                        onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, phone: e.target.value } }))} />
                    </Field>
                    <Field label="Documento (BI/Passaporte) *" icon={FileText}>
                      <input className={inputCls()} value={form.guest.idDocument} placeholder="Nº do documento"
                        onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, idDocument: e.target.value } }))} />
                    </Field>
                    <Field label="Província" icon={MapPin}>
                      <input className={inputCls()} value={form.guest.province} placeholder="Luanda"
                        onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, province: e.target.value } }))} />
                    </Field>
                    <Field label="País" className="sm:col-span-2">
                      <select className={inputCls(false) + ' pl-3'} value={form.guest.country}
                        onChange={e => setForm(f => ({ ...f, guest: { ...f.guest, country: e.target.value } }))}>
                        <option value="Angola">Angola</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Brasil">Brasil</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </Field>
                  </div>
                </SectionCard>

                <div className="flex justify-between">
                  <button onClick={() => setCurrentStep('select-room')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                    <ChevronLeft size={15} /> Voltar
                  </button>
                  <StepBtn disabled={!canProceedToReview} onClick={() => setCurrentStep('review')}>
                    Continuar <ArrowRight size={15} />
                  </StepBtn>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 'review' && selectedRoom && (
              <div className="space-y-5 animate-fadeIn">
                <SectionCard title="Resumo da reserva" icon={Sparkles}>
                  <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                      <img
                        src={selectedRoom.imageUrl?.startsWith('http') ? selectedRoom.imageUrl : `https://placehold.co/80x80/001E3D/FFFFFF?text=${selectedRoom.number}`}
                        alt="Quarto" className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-[#001E3D]">{selectedRoom.title || `Quarto ${selectedRoom.number}`}</p>
                      <p className="text-xs text-slate-400">{selectedRoom.type}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      ['Período',  `${formatDate(form.checkIn)} → ${formatDate(form.checkOut)}`],
                      ['Duração',  `${nights} ${nights === 1 ? 'noite' : 'noites'}`],
                      ['Diária',   formatCurrency(selectedRoom.pricePerNight)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-medium text-slate-700">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-semibold text-[#001E3D]">Total</span>
                      <span className="text-2xl font-black text-[#001E3D] font-serif">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Dados do hóspede" icon={User}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Nome',       form.guest.name],
                      ['Email',      form.guest.email],
                      ['Telefone',   form.guest.phone],
                      ['Documento',  form.guest.idDocument],
                      ['Província',  form.guest.province || '—'],
                      ['País',       form.guest.country],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-0.5">{k}</p>
                        <p className="font-medium text-slate-700">{v}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <div className="flex justify-between">
                  <button onClick={() => setCurrentStep('guest-data')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                    <ChevronLeft size={15} /> Voltar
                  </button>
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-7 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
                  >
                    {createMutation.isPending ? 'A processar…' : <><CheckCircle size={15} /> Confirmar Reserva</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL PANEL */}
      {selectedRes && (
        <ReservationDetailPanel
          reservation={selectedRes}
          isStaff={isStaff}
          isClient={isClient}
          onClose={() => setSelectedRes(null)}
          onAction={(id, act) => actionMutation.mutate({ id, action: act })}
          onCancel={(id) => setCancelId(id)}
          refetch={refetch}
        />
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={!!cancelId}
        title="Cancelar Reserva"
        description="Tem a certeza que deseja cancelar esta reserva? Esta ação reverterá o estado do quarto e não pode ser desfeita."
        onConfirm={() => cancelId && actionMutation.mutate({ id: cancelId, action: 'cancel' })}
        onClose={() => setCancelId(null)}
      />
    </div>
  )
}