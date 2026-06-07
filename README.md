# 🏨 Hotel PMS — Sistema de Gestão Hoteleira

Frontend React + Vite completo integrado com a API REST do hotel.

## 🗂️ Estrutura do Projecto

```
hotel-pms/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .env.example
└── src/
    ├── main.tsx                      ← Entry point
    ├── App.tsx                       ← Rotas lazy + providers
    ├── index.css                     ← Tokens de design (Tailwind)
    ├── api/
    │   ├── client.ts                 ← Axios + interceptores JWT
    │   └── services.ts               ← Todos os endpoints da API
    ├── store/
    │   ├── authStore.ts              ← Zustand auth (persistido)
    │   └── uiStore.ts                ← Zustand UI (sidebar)
    ├── types/
    │   └── index.ts                  ← Todos os tipos TypeScript
    ├── utils/
    │   └── index.ts                  ← Helpers (datas, cores, labels)
    ├── components/
    │   ├── ui/
    │   │   └── index.tsx             ← Badge, Modal, Spinner, LazyImage, etc.
    │   └── layout/
    │       ├── AppLayout.tsx         ← Wrapper principal
    │       ├── Sidebar.tsx           ← Navegação lateral
    │       ├── Topbar.tsx            ← Cabeçalho
    │       └── ProtectedRoute.tsx    ← Guard de rotas por papel
    └── pages/
        ├── auth/
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   └── ForgotPasswordPage.tsx
        ├── dashboard/
        │   └── DashboardPage.tsx
        ├── rooms/
        │   └── RoomsPage.tsx
        ├── reservations/
        │   └── ReservationsPage.tsx
        ├── tickets/
        │   └── TicketsPage.tsx
        ├── policies/
        │   └── PoliciesPage.tsx
        ├── reports/
        │   └── ReportsPage.tsx
        └── users/
            ├── UsersPage.tsx
            └── ProfilePage.tsx
```

## 🚀 Instalação e Execução

```bash
# 1. Entrar na pasta
cd hotel-pms

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com a URL do backend

# 4. Iniciar em desenvolvimento
npm run dev

# 5. Build para produção
npm run build
```

## 👤 Papéis de Utilizador

| Papel | Acesso |
|---|---|
| `admin` | Tudo — incluindo Utilizadores e Relatórios |
| `receptionist` | Dashboard, Quartos, Reservas, Tickets, Políticas, Relatórios |
| `guest` | Dashboard, Reservas, Tickets, Políticas, Perfil |

## ✨ Stack Tecnológica

| Tecnologia | Uso |
|---|---|
| React 18 + Vite | Framework + bundler |
| TypeScript | Tipagem estática |
| Tailwind CSS | Estilos utility-first |
| Zustand | Estado global (auth + UI) |
| React Query | Cache e fetching de dados |
| React Router v6 | Lazy routes + guards |
| Axios | Cliente HTTP + interceptores |
| Recharts | Gráficos de relatórios |
| react-hot-toast | Notificações |
| date-fns | Formatação de datas |
| Lucide React | Ícones |

## 🔐 Autenticação

- JWT armazenado com Zustand persist (localStorage)
- Interceptor Axios injeta `Authorization: Bearer <token>`
- Redirect automático para `/login` em caso de 401
- Guards de rota por papel (`ProtectedRoute`)

## 🖼️ Lazy Loading

- **Rotas**: todas as páginas são `React.lazy()` com `Suspense`
- **Imagens**: componente `LazyImage` com `IntersectionObserver`
  - Placeholder animado enquanto carrega
  - Fallback em caso de erro
  - URL base `http://localhost:3000/uploads/{filename}`
