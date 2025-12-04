import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Truck, FileText, Settings, Bell, UserCheck, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/entregadores', icon: UserCheck, label: 'Entregadores' },
  { to: '/entregas', icon: Truck, label: 'Entregas' },
  { to: '/rastreamento', icon: MapPin, label: 'Rastreamento' },
  { to: '/pesquisa', icon: FileText, label: 'Pesquisar' },
];

const Sidebar = () => {
  const activeClass = 'bg-white/20';
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-screen w-20 flex-col items-center bg-gradient-to-b from-[#A445F7] to-[#3B82F6] text-white shadow-2xl z-50">
      <div className="w-12 h-12 mx-auto my-4 flex items-center justify-center rounded-2xl hover:bg-white/10 cursor-pointer">
        <Bell size={24} />
      </div>
      
      <nav className="flex flex-col items-center gap-4 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all duration-300 ${isActive ? activeClass : ''}`
            }
            title={item.label}
          >
            <item.icon size={24} />
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto mb-4 flex flex-col items-center gap-4">
         <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-all duration-300 ${isActive ? activeClass : ''}`
            }
            title="Configurações"
          >
            <Settings size={24} />
          </NavLink>
          <div
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 cursor-pointer transition-all duration-300"
            title="Sair"
          >
            <LogOut size={24} />
          </div>
        <div className="w-12 h-12 rounded-2xl cursor-pointer">
            <img src="https://i.pravatar.cc/48?u=user" alt="User Avatar" className="rounded-2xl w-full h-full" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;