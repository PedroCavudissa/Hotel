import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Hotel, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { authApi } from '@/api/services'

import { Spinner } from '@/components/ui'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica
    if (!form.email.trim() || !form.password.trim()) {
      toast.error('Preencha todos os campos')
      return
    }
    
    setLoading(true)
    
    try {
      const res = await authApi.login(form)
      console.log('Resposta:', res)
      
      if (res.data?.user && res.data?.token) {
        setAuth(res.data.user, res.data.token)
        toast.success('Sessão iniciada com sucesso!')
       if(res.data.user.role === 'CLIENT' || res.data.user.role === 'RECEPTION') {
          navigate('/reservations')
        } else {
          navigate('/dashboard')
        }
      } else {
        throw new Error('Resposta inválida do servidor')
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      
      // Verificar se o erro é de email não verificado
      const message = err.response?.data?.message ?? 
                      err.response?.data?.error ?? 
                      err.message ?? 
                      'Credenciais inválidas'
      
      if (message.toLowerCase().includes('verificar') || 
          message.toLowerCase().includes('verify') ||
          message.toLowerCase().includes('não foi verificado')) {
        localStorage.setItem('email_verificacao', form.email)
        toast.error('Email não verificado. Por favor, verifique sua caixa de entrada.')
        navigate('/verify-email', { state: { email: form.email } })
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false) // Garante que o loading para em qualquer caso
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full grid grid-cols-1 lg:grid-cols-2 bg-[#FAF9F6]">
      {/* Left panel - Azul escuro PEDRO */}
      <div className="hidden lg:flex bg-[#001E3D] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hotel-bg.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center">
              <Hotel size={20} className="text-[#001E3D]" />
            </div>
            <span className="font-serif text-xl font-semibold text-white">PEDRO HOTEL</span>
          </div>
        </div>
        <div className="relative z-10">
          <blockquote className="font-serif text-3xl font-medium text-white leading-snug mb-4">
            "Hospitalidade é a arte<br />de fazer-se sentir em casa."
          </blockquote>
          <p className="text-slate-300 text-sm">
            Sistema integrado de gestão para hotéis modernos.
          </p>
        </div>
        <div className="relative z-10 flex gap-2">
          {['Reservas', 'Quartos', 'Relatórios', 'Tickets'].map(t => (
            <span key={t} className="px-3 py-1.5 bg-white/10 rounded-full text-xs text-slate-300">{t}</span>
          ))}
        </div>
      </div>

      {/* Right panel - Formulário */}
      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Botão Voltar para Home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#001E3D] transition-colors mb-6 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para o início
          </button>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-[#001E3D] rounded-xl flex items-center justify-center">
              <Hotel size={18} className="text-white" />
            </div>
            <span className="font-serif text-lg font-semibold text-[#001E3D]">PEDRO HOTEL</span>
          </div>

          <h1 className="font-serif text-3xl font-semibold text-[#001E3D] mb-2">Bem-vindo</h1>
          <p className="text-slate-500 text-sm mb-8">Entre na sua conta para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#001E3D] uppercase tracking-wider mb-2">Email</label>
              <input 
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200/80 bg-white focus:outline-none focus:border-[#001E3D] focus:ring-1 focus:ring-[#001E3D] transition-all text-sm shadow-sm" 
                type="email" 
                placeholder="nome@hotel.com"
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                disabled={loading}
                required 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#001E3D] uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200/80 bg-white focus:outline-none focus:border-[#001E3D] focus:ring-1 focus:ring-[#001E3D] transition-all text-sm shadow-sm" 
                  type={showPw ? 'text' : 'password'} 
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                  disabled={loading}
                  required 
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw(!showPw)}
                  disabled={loading}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Link to="/auth/forgot-password" className="text-sm text-[#D4AF37] hover:text-[#c5a32e] font-medium">
                Esqueceu a password?
              </Link>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-[#001E3D] hover:bg-[#002d5c] text-white py-3.5 rounded-xl font-medium tracking-wide transition-all shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={16} className="text-white animate-spin" /> 
                  A entrar...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Não tem conta?{' '}
            <Link to="/auth/register" className="text-[#001E3D] hover:text-[#002d5c] font-semibold transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}