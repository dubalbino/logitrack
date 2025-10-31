import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEntregas } from '@/hooks/useEntregas';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Plus, Truck, LayoutGrid, List, MoreVertical, User, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { EntregaCompleta, SituacaoPedido } from '@/types';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';

const statusOrder: SituacaoPedido[] = [
  'pedido_confirmado',
  'pronto_envio',
  'enviado',
  'entrega_realizada',
  'entrega_sem_sucesso', // Agrupando problemas
];

const statusProblematicos: SituacaoPedido[] = ['entrega_sem_sucesso', 'devolvido_remetente', 'avariado', 'extravio'];

const statusColumnMap: Record<string, SituacaoPedido> = {
    'Confirmado': 'pedido_confirmado',
    'Pronto': 'pronto_envio',
    'Enviado': 'enviado',
    'Entregue': 'entrega_realizada',
    'Problemas': 'entrega_sem_sucesso',
}

const DraggableEntregaCard = ({ entrega }: { entrega: EntregaCompleta }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entrega.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const borderColor = getStatusColor(entrega.situacao_pedido).replace('bg', 'border').replace('-100', '-500').replace('text-blue-700', 'border-blue-500'); // Hacky color conversion

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`bg-white rounded-xl p-4 shadow-md hover:shadow-xl cursor-grab active:cursor-grabbing mb-4 border-l-4 ${borderColor}`}>
        <div className="flex justify-between items-start">
            <span className="font-bold text-slate-800">#{entrega.numero_pedido}</span>
            {entrega.situacao_prazo === 'atrasado' && 
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse-slow">ATRASADO</span>
            }
        </div>
        <p className="text-slate-700 font-medium my-2 truncate">{entrega.descricao_compra}</p>
        <div className="text-sm text-slate-500 space-y-1">
            <p className="flex items-center gap-2"><User size={14}/> {entrega.cliente_nome}</p>
            <p className="flex items-center gap-2"><DollarSign size={14}/> {formatCurrency(entrega.valor)}</p>
            <p className="flex items-center gap-2"><Calendar size={14}/> Prev: {formatDate(entrega.previsao_entrega)}</p>
        </div>
    </div>
  );
};

const KanbanColumn = ({ title, entregas }: { title: string, entregas: EntregaCompleta[] }) => {
    const { setNodeRef } = useSortable({ id: title });
    return (
        <div ref={setNodeRef} className="bg-slate-100 rounded-2xl p-4 w-80 flex-shrink-0 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700">{title}</h3>
                <span className="bg-white rounded-full px-3 py-1 text-sm font-semibold">{entregas.length}</span>
            </div>
            <SortableContext items={entregas.map(e => e.id)}>
                <div className="overflow-y-auto h-[calc(100vh-250px)] pr-2">
                    {entregas.map(entrega => <DraggableEntregaCard key={entrega.id} entrega={entrega} />)}
                </div>
            </SortableContext>
        </div>
    )
}

const EntregasTableView = ({ entregas, loading }: { entregas: EntregaCompleta[], loading: boolean }) => {
  // Placeholder for stats
  const totalFaturamento = entregas.reduce((acc, e) => e.situacao_pedido === 'entrega_realizada' ? acc + e.valor : acc, 0);

  return (
    <div>
      {/* Filtros Avançados - UI Placeholder */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
        <p className="text-center text-slate-500">Filtros avançados em construção</p>
      </div>

      {/* Resumo Estatístico */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6 mb-6 shadow-lg grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm opacity-80">Total de Entregas</p>
          <p className="text-2xl font-bold">{entregas.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-80">Faturamento Total</p>
          <p className="text-2xl font-bold">{formatCurrency(totalFaturamento)}</p>
        </div>
        {/* Outras estatísticas aqui */}
      </div>

      {/* Tabela */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xl border border-white/20">
        <table className="w-full text-left">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Pedido</th>
              <th className="p-4 font-semibold text-slate-700">Cliente</th>
              <th className="p-4 font-semibold text-slate-700">Valor</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700">Prazo</th>
              <th className="p-4 font-semibold text-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-4"><div className="h-8 bg-slate-200 rounded animate-pulse"></div></td></tr>
              ))
            ) : (
              entregas.map(entrega => (
                <tr key={entrega.id} className={`border-b border-slate-200 hover:bg-purple-50 transition ${entrega.situacao_prazo === 'atrasado' ? 'border-l-4 border-red-500' : ''}`}>
                  <td className="p-4 font-mono font-bold text-purple-600">#{entrega.numero_pedido}</td>
                  <td className="p-4 text-slate-800 font-medium">{entrega.cliente_nome}</td>
                  <td className="p-4 font-semibold text-green-600">{formatCurrency(entrega.valor)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entrega.situacao_pedido)}`}>
                      {getStatusLabel(entrega.situacao_pedido)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entrega.situacao_prazo)}`}>
                      {getStatusLabel(entrega.situacao_prazo)}
                    </span>
                  </td>
                  <td className="p-4"><button><MoreVertical size={20} className="text-slate-500"/></button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ListaEntregas = () => {
  const [viewMode, setViewMode] = useState('kanban');
  const { entregas, loading, updateEntrega } = useEntregas();

  const groupedEntregas = useMemo(() => {
    const groups: Record<string, EntregaCompleta[]> = {
        'Confirmado': [], 'Pronto': [], 'Enviado': [], 'Entregue': [], 'Problemas': []
    };
    entregas.forEach(entrega => {
        if (statusProblematicos.includes(entrega.situacao_pedido)) {
            groups['Problemas'].push(entrega);
        } else if (entrega.situacao_pedido === 'pedido_confirmado') {
            groups['Confirmado'].push(entrega);
        } else if (entrega.situacao_pedido === 'pronto_envio') {
            groups['Pronto'].push(entrega);
        } else if (entrega.situacao_pedido === 'enviado') {
            groups['Enviado'].push(entrega);
        } else if (entrega.situacao_pedido === 'entrega_realizada') {
            groups['Entregue'].push(entrega);
        }
    });
    return groups;
  }, [entregas]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overContainer = over.id.toString(); // Can be a column id or another card id

    // Find which column the card was dropped into
    let newStatus: SituacaoPedido | undefined;
    Object.keys(statusColumnMap).forEach(colName => {
        if(overContainer.includes(colName)) newStatus = statusColumnMap[colName];
    })
    
    if (newStatus) {
        const entrega = entregas.find(e => e.id === activeId);
        if (entrega && entrega.situacao_pedido !== newStatus) {
            updateEntrega(entrega.id, { situacao_pedido: newStatus });
        }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3"><Truck size={36} className="text-purple-600"/> <h1 className="text-3xl font-bold text-slate-800">Entregas</h1></div>
        <div className="flex items-center gap-4">
            <div className="bg-slate-200 p-1 rounded-lg flex items-center">
                <button onClick={() => setViewMode('kanban')} className={`px-4 py-2 rounded-md text-sm font-semibold ${viewMode === 'kanban' ? 'bg-white shadow' : 'text-slate-600'}`}><LayoutGrid size={16} className="inline mr-2"/>Kanban</button>
                <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-md text-sm font-semibold ${viewMode === 'table' ? 'bg-white shadow' : 'text-slate-600'}`}><List size={16} className="inline mr-2"/>Tabela</button>
            </div>
            <Link to="/entregas/novo" className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg"><Plus size={20} /> Nova Entrega</Link>
        </div>
      </div>

      {viewMode === 'kanban' && (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="flex gap-6 w-full h-full overflow-x-auto pb-4">
                {Object.entries(groupedEntregas).map(([title, items]) => (
                    <KanbanColumn key={title} title={title} entregas={items} />
                ))}
            </div>
        </DndContext>
      )}

      {viewMode === 'table' && <EntregasTableView entregas={entregas} loading={loading} />}
    </motion.div>
  );
};

export default ListaEntregas;