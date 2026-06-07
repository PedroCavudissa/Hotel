// src/components/layout/MainLayout.tsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Home as HomeIcon, Bed, Calendar, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import useAuthStore from "@/store/authStore";

export default function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Se já estiver na página de contacto
    if (window.location.pathname === '/contacto') {
      const footer = document.getElementById('footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navegar para a página de contacto com hash
      navigate('/contacto#footer');
    }
  };

  const navLinks = [
    { to: "/", label: "Início", icon: <HomeIcon size={18} /> },
    { to: "/quartos", label: "Quartos", icon: <Bed size={18} /> },

  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-3" : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 z-20">
            <span className="text-2xl font-serif font-bold text-[#001E3D]">PEDRO</span>
            <span className="text-2xl font-serif font-bold text-amber-500">HOTEL</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={link.onClick}
                className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  Olá, {user.name?.split(" ")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  className="px-5 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-sm"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden z-20 p-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-0 bg-white z-10 pt-24 px-6">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => {
                    if (link.onClick) link.onClick(e);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 text-base font-medium text-slate-700 border-b border-slate-100 hover:text-amber-600 transition-colors"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                {user ? (
                  <>
                    <span className="text-sm text-slate-600 py-2">
                      Olá, {user.name}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg"
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <User size={16} />
                      Entrar
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-3 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Cadastrar
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content - Adiciona padding top para evitar que o menu cubra o conteúdo */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      {/* Footer com ID para âncora */}
      <footer id="footer" className="bg-[#001E3D] text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xl font-serif font-bold">PEDRO</span>
                <span className="text-xl font-serif font-bold text-amber-500">HOTEL</span>
              </div>
              <p className="text-sm text-slate-400">
                Luxo, conforto e hospitalidade em cada detalhe.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Rápidos</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/" className="hover:text-amber-500 transition">Início</Link></li>
                <li><Link to="/quartos" className="hover:text-amber-500 transition">Quartos</Link></li>
           
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>📍 Luanda, Angola</li>
                <li>📞 +244 900 000 000</li>
                <li>✉️ reservas@pedrohotel.com</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Horário</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Check-in: 14:00</li>
                <li>Check-out: 12:00</li>
                <li>Recepção: 24 horas</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} PEDRO HOTEL. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}