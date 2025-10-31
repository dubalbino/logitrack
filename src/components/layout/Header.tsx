import { Search, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/50 backdrop-blur-xl">
      <div className="h-20 px-4 md:px-8 flex items-center justify-between">
        {/* Botão Hamburger Menu para Mobile */}
        <button className="md:hidden text-slate-700">
          <Menu size={28} />
        </button>

        {/* Título da Página (visível em telas maiores) */}
        <div className="hidden md:block">
          <h1 className="font-bold text-2xl text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Visão geral do seu negócio</p>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          {/* Barra de Busca */}
          <div className="relative w-40 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-slate-100/80 border-0 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Avatar do Usuário */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg cursor-pointer">
              <img src="https://i.pravatar.cc/48?u=user" alt="User Avatar" className="rounded-full w-full h-full" />
            </div>
            <div className='hidden sm:block'>
                <h3 className="font-semibold text-slate-700">Usuário</h3>
                <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;