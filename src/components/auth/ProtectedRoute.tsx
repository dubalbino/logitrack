import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

// O Layout principal será criado na Etapa 4 e substituirá este placeholder
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // Idealmente, aqui teríamos a Sidebar e o Header
  return <div>{children}</div>;
};

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen w-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // O Outlet renderizará os componentes filhos da rota (Dashboard, Clientes, etc.)
  // dentro do layout principal que será definido na próxima etapa.
  return <AppLayout><Outlet /></AppLayout>;
};
