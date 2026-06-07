// src/pages/public/Catalog.tsx
import { useState, useEffect } from "react";
import { SlidersHorizontal, Users, MapPin, Wifi, Tv, Wind, Coffee } from "lucide-react";
import { roomsApi } from "@/api/services";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/authStore"; // IMPORTANTE: importar o auth store

// Interface baseada na resposta real da API
interface Amenity {
  id: string;
  name: string;
  createdAt: string;
}

interface Room {
  id: string;
  number: string;
  type: string;
  title: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  floor: number | null;
  imageUrl: string;
  state: string;
  maintenance: string;
  inspection: string;
  amenities: Amenity[];
  createdAt: string;
  updatedAt: string;
}

export default function Catalog() {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // PEGA O USUÁRIO LOGADO
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsApi.list();
      
      let roomsData: Room[] = [];
      if (Array.isArray(response.data)) {
        roomsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        roomsData = response.data.data;
      } else if (response.data?.content && Array.isArray(response.data.content)) {
        roomsData = response.data.content;
      }
      
      // FILTRA APENAS QUARTOS COM STATE = VACANT_CLEAN
      const availableRooms = roomsData.filter(room => room.state === 'VACANT_CLEAN');
      
      setRooms(availableRooms);
    } catch (error) {
      console.error("Erro ao buscar quartos:", error);
      toast.error("Erro ao carregar quartos");
    } finally {
      setLoading(false);
    }
  };

  const handleReserveClick = (room: Room) => {
    if (user) {
      // CLIENT logado - vai para página de reserva dentro da área logada
      navigate(`/reservations?roomId=${room.id}`);
    } else {
      // Visitante - salva e vai para login
      localStorage.setItem('selectedRoom', JSON.stringify({
        id: room.id,
        number: room.number,
        type: room.type,
        title: room.title,
        pricePerNight: room.pricePerNight,
        imageUrl: room.imageUrl
      }));
      navigate('/login', { state: { fromReservation: true, roomId: room.id } });
    }
  };

  // Categorias baseadas apenas nos quartos disponíveis
  const categorias = ["Todos", ...Array.from(new Set(rooms.map((room) => room.type)))];

  const handleFilterChange = (cat: string) => {
    setActiveFilter(cat);
  };

  const quartosFiltrados = activeFilter === "Todos"
    ? rooms
    : rooms.filter((room) => room.type === activeFilter);

  // Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('AOA', 'Kz');
  };

  // Função para obter imagem válida
  const getValidImageUrl = (room: Room) => {
    if (room.imageUrl && room.imageUrl !== 'string' && room.imageUrl.startsWith('http')) {
      return room.imageUrl;
    }
    // Fallback apenas para imagens inválidas
    return `https://placehold.co/600x400/001E3D/white?text=Quarto+${room.number}`;
  };

  // Função para obter ícone da comodidade
  const getAmenityIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wifi')) return <Wifi size={10} />;
    if (lowerName.includes('tv')) return <Tv size={10} />;
    if (lowerName.includes('ar') || lowerName.includes('ac')) return <Wind size={10} />;
    if (lowerName.includes('cafe') || lowerName.includes('coffee')) return <Coffee size={10} />;
    return <Wifi size={10} />;
  };

  return (
    <div className="w-full">
      {/* BANNER DE TÍTULO */}
      <div className="bg-[#001E3D] text-white py-16 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto space-y-3">
          <span className="text-amber-500/80 text-xs font-bold uppercase tracking-widest block">Catálogo</span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">Encontre o seu quarto perfeito</h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl">
            {rooms.length} {rooms.length === 1 ? 'quarto disponível' : 'quartos disponíveis'} para reserva imediata
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS - Só mostra se houver quartos */}
      {rooms.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 -mt-7 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-3 flex items-center gap-3 overflow-x-auto no-scrollbar border border-slate-100">
            <div className="p-2.5 text-slate-400 border-r border-slate-100 hidden sm:block">
              <SlidersHorizontal size={18} />
            </div>
            <div className="flex gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeFilter === cat 
                      ? "bg-[#001E3D] text-white shadow-md shadow-blue-950/20" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GRID DE QUARTOS */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, idx) => <RoomCardSkeleton key={idx} />)
          ) : quartosFiltrados.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <SlidersHorizontal size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Nenhum quarto disponível no momento.</p>
              <p className="text-slate-400 text-sm mt-1">Volte mais tarde para ver novas disponibilidades.</p>
            </div>
          ) : (
            quartosFiltrados.map((quarto) => (
              <div key={quarto.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="relative overflow-hidden aspect-[4/3] m-3 rounded-2xl bg-slate-100">
                    <img 
                      src={getValidImageUrl(quarto)} 
                      alt={quarto.title || quarto.type} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-amber-100/90 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide backdrop-blur-xs border border-amber-200/30">
                        {quarto.type}
                      </span>
                      <span className="bg-green-100/90 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide backdrop-blur-xs border border-green-200/30">
                        Disponível
                      </span>
                    </div>
                  </div>
                  <div className="px-5 pt-2 pb-4 space-y-3">
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {quarto.capacity} {quarto.capacity === 1 ? 'hóspede' : 'hóspedes'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> Piso {quarto.floor || 'Térreo'}
                      </span>
                      <span>• Nº {quarto.number}</span>
                    </div>
                    <h3 className="text-slate-800 font-serif text-base font-semibold leading-relaxed">
                      {quarto.title || quarto.type}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                      {quarto.description}
                    </p>
                    {quarto.amenities && quarto.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {quarto.amenities.slice(0, 3).map((amenity) => (
                          <span key={amenity.id} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
                            {getAmenityIcon(amenity.name)} {amenity.name}
                          </span>
                        ))}
                        {quarto.amenities.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{quarto.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-serif text-[#001E3D] font-medium">
                      {formatPrice(quarto.pricePerNight)}
                    </span>
                    <span className="text-slate-400 text-xs font-medium tracking-wide"> / noite</span>
                  </div>
                  <button 
                    onClick={() => handleReserveClick(quarto)}
                    className="text-xs font-bold text-amber-600 tracking-wider uppercase hover:text-amber-700 inline-flex items-center gap-1 transition-colors group-hover:translate-x-1"
                  >
                    Reservar →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Componente Skeleton para loading
function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] m-3 rounded-2xl bg-slate-200" />
      <div className="px-5 pt-2 pb-4 space-y-3">
        <div className="flex gap-4">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-3 bg-slate-200 rounded w-12" />
        </div>
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
      <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex justify-between">
        <div className="h-6 bg-slate-200 rounded w-24" />
        <div className="h-6 bg-slate-200 rounded w-16" />
      </div>
    </div>
  );
}