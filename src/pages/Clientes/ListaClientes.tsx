import { Link } from 'react-router-dom';
import { useClientes } from '@/hooks/useClientes';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Search, MapPin, Info, Eye, Edit, Trash2 } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import { Cliente } from '@/types';

// Skeleton Card Component
const SkeletonCard = () => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-4 shadow-md animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-200"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

// Client Card Component
const ClientCard = ({ cliente, onDelete }: { cliente: Cliente, onDelete: (id: string) => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-4 border border-slate-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center">
          {getInitials(cliente.nome)}
        </div>
        <div>
          <h3 className="font-bold text-lg text-slate-800">{cliente.nome}</h3>
          <p className="text-slate-600 text-sm">{cliente.cpf ? `CPF: ${cliente.cpf}` : `CNPJ: ${cliente.cnpj}`}</p>
          <p className="text-slate-500 text-sm mt-1">{cliente.telefone} &bull; {cliente.email}</p>
          <p className="text-slate-400 text-xs mt-2">📅 Cadastrado em {formatDate(cliente.created_at)}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="inline-flex bg-slate-100 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 items-center gap-1">
            <MapPin size={12} />
            {cliente.cidade} - {cliente.uf}
        </div>
      </div>
    </div>
    <div className="flex justify-end items-center mt-4 gap-2">
        <button className="bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-600 rounded-lg px-4 py-2 flex items-center gap-2 transition text-sm"><Eye size={14}/> Ver</button>
        <Link to={`/clientes/${cliente.id}/editar`} className="bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-600 rounded-lg px-4 py-2 flex items-center gap-2 transition text-sm"><Edit size={14}/> Editar</Link>
        <button onClick={() => onDelete(cliente.id)} className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg px-4 py-2 flex items-center gap-2 transition text-sm"><Trash2 size={14}/> Excluir</button>
    </div>
  </motion.div>
);

const ListaClientes = () => {
  const { clientes, loading, deleteCliente } = useClientes();

  const handleDelete = (id: string) => {
    // TODO: Add Shadcn Dialog for confirmation
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteCliente(id);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="text-purple-600" size={36} />
          <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>
        </div>
        <Link to="/clientes/novo">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={20} />
            Novo Cliente
          </motion.button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Buscar por nome, CPF, telefone..." className="w-full bg-slate-50 rounded-xl px-12 py-3 focus:ring-2 focus:ring-purple-500"/>
            </div>
            <div>{/* Placeholder for UF Select */}
                <input type="text" placeholder="UF" className="w-full bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500"/>
            </div>
            <button className="bg-slate-100 text-slate-700 rounded-xl px-4 py-3 hover:bg-slate-200 transition">Limpar</button>
        </div>
      </div>

      {/* Info Card */}
      {!loading && (
        <div className="bg-blue-50 text-blue-700 rounded-xl p-4 mb-4 flex items-center gap-2 text-sm">
          <Info size={16} />
          <span>{clientes.length} cliente{clientes.length !== 1 && 's'} encontrado{clientes.length !== 1 && 's'}.</span>
        </div>
      )}

      {/* Lista de Clientes */}
      <div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : clientes.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl">
            <Users size={64} className="mx-auto text-slate-400"/>
            <h3 className="mt-4 text-lg font-semibold text-slate-600">Nenhum cliente encontrado</h3>
            <p className="text-slate-500 mt-2">Comece cadastrando um novo cliente.</p>
            <Link to="/clientes/novo" className="mt-6 inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
              + Adicionar Cliente
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {clientes.map(cliente => (
              <ClientCard key={cliente.id} cliente={cliente} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* TODO: Paginação */}
    </motion.div>
  );
};

export default ListaClientes;