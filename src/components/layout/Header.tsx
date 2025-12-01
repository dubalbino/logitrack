import { Menu } from 'lucide-react';
import logoUrl from '../../assets/logo.png';

const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-black text-white">
      <div className="h-20 px-4 md:px-8 flex items-center justify-between">
        {/* Botão Hamburger Menu para Mobile */}
        <button className="md:hidden text-gray-300">
          <Menu size={28} />
        </button>

        {/* Logo e novo título */}
        <div className="hidden md:flex items-center gap-4">
          <img src={logoUrl} alt="LogiTrack Logo" className="h-10 w-auto" />
          
        </div>

        {/* Avatar do Usuário */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="w-12 h-12 rounded-full border-2 border-gray-700 shadow-lg cursor-pointer hover:scale-105 transition-transform">
            <img src="https://i.pravatar.cc/48?u=user" alt="User Avatar" className="rounded-full w-full h-full" />
          </div>
          <div className='hidden sm:block'>
            <h3 className="font-semibold text-white">Usuário</h3>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;