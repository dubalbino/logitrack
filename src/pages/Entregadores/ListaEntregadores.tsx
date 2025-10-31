import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEntregadores } from '@/hooks/useEntregadores';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Truck, Search, AlertTriangle, CheckCircle, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import { Entregador } from '@/types';

interface EntregadorComStatus extends Entregador {
  cnh_situacao: 'no_prazo' | 'vencida';
}

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

// Entregador Card Component
const EntregadorCard = ({ entregador, onDelete }: { entregador: EntregadorComStatus, onDelete: (id: string) => void }) => {
  const isCnhVencida = entregador.cnh_situacao === 'vencida';
  const cardClasses = isCnhVencida
    ? 'border-2 border-red-500 bg-red-50/50'
    : 'border border-slate-200 bg-white/80';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`backdrop-blur-xl rounded-2xl p-6 mb-4 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${cardClasses}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${isCnhVencida ? 'from-red-500 to-rose-600' : 'from-purple-500 to-indigo-600'} text-white font-bold text-xl flex items-center justify-center`}>
            {getInitials(entregador.nome)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{entregador.nome}</h3>
            <p className="text-slate-600 text-sm">{entregador.veiculo_modelo} - {entregador.veiculo_placa}</p>
            <p className="text-slate-500 text-sm mt-1">{entregador.telefone} &bull; {entregador.email}</p>
          </div>
        </div>
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold items-center gap-2 ${isCnhVencida ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {isCnhVencida ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
          CNH {isCnhVencida ? 'Vencida' : 'No Prazo'}
        </div>
      </div>
      {isCnhVencida && (
        <div className="mt-4 bg-red-100 rounded-xl p-3 flex items-center gap-3 text-red-700 text-sm">
            <AlertTriangle size={20}/>
            <span>CNH vencida em {formatDate(entregador.cnh_vencimento)}. Este entregador não pode ser selecionado para novas entregas.</span>
        </div>
      )}
      <div className="flex justify-end items-center mt-4 gap-2">
        <button className="bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-600 rounded-lg px-4 py-2 flex items-center gap-2 transition text-sm"><Eye size={14}/> Ver</button>
        <Link to={`/entregadores/${entregador.id}/editar`} className="bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-600 rounded-lg px-4 py-2 flex items-center gap-2 transition text-sm"><Edit size={14}/> Editar</Link>
        <button onClick={() => onDelete(entregador.id)} className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg px-4 py-2 flex items-center gap-2 transition text-sm"><Trash2 size={14}/> Excluir</button>
      </div>
    </motion.div>
  );
};

const ListaEntregadores = () => {
  const { entregadores, loading, deleteEntregador } = useEntregadores();

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este entregador?')) {
      deleteEntregador(id);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Truck className="text-purple-600" size={36} />
          <h1 className="text-3xl font-bold text-slate-800">Entregadores</h1>
        </div>
        <Link to="/entregadores/novo">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus size={20} />
            Novo Entregador
          </motion.button>
        </Link>
      </div>

      {/* TODO: Filtros */}

      {/* Lista de Entregadores */}
      <div>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : entregadores.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl">
            <Truck size={64} className="mx-auto text-slate-400"/>
            <h3 className="mt-4 text-lg font-semibold text-slate-600">Nenhum entregador encontrado</h3>
            <p className="text-slate-500 mt-2">Comece cadastrando um novo entregador.</p>
            <Link to="/entregadores/novo" className="mt-6 inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition">
              + Adicionar Entregador
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {entregadores.map(entregador => (
              <EntregadorCard key={entregador.id} entregador={entregador} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default ListaEntregadores;