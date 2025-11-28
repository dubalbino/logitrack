import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEntregas } from '@/hooks/useEntregas';
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Plus, Truck, LayoutGrid, List, User, DollarSign, Calendar, Pencil } from 'lucide-react';
import { EntregaCompleta, SituacaoPedido } from '@/types';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';

const statusProblematicos: SituacaoPedido[] = ['entrega_sem_sucesso', 'devolvido_remetente', 'avariado', 'extravio'];

const statusColumnMap: Record<string, SituacaoPedido> = {
    'Confirmado': 'pedido_confirmado',
    'Pronto': 'pronto_envio',
    'Enviado': 'enviado',
    'Entregue': 'entrega_realizada',
    'Problemas': 'entrega_sem_sucesso',
}

const safeFormatDate = (date: any): string => {
  if (!date) return 'Não definida';
  try {
    return formatDate(date);
  } catch (error) {
    console.error('Erro ao formatar data:', date, error);
    return 'Data inválida';
  }
};

const EntregaCard = ({ entrega, isDragging = false }: { entrega: EntregaCompleta, isDragging?: boolean }) => {
  const borderColor = getStatusColor(entrega.situacao_pedido).replace('bg', 'border').replace('-100', '-500').replace('text-blue-700', 'border-blue-500');

  return (
    <div className={`bg-white rounded-xl p-4 shadow-md hover:shadow-xl mb-4 border-l-4 ${borderColor} ${isDragging ? 'opacity-50' : ''}`}>
        <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-slate-800">#{entrega.numero_pedido}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(entrega.situacao_pedido)}`}>
              {getStatusLabel(entrega.situacao_pedido)}
            </span>
        </div>
        <p className="text-slate-700 font-medium my-2 truncate">{entrega.descricao_compra}</p>
        <div className="text-sm text-slate-500 space-y-1">
            <p className="flex items-center gap-2"><User size={14}/> {entrega.cliente_nome}</p>
            <p className="flex items-center gap-2"><DollarSign size={14}/> {formatCurrency(entrega.valor)}</p>
            <p className="flex items-center gap-2"><Calendar size={14}/> Prev: {safeFormatDate(entrega.previsao_entrega)}</p>
        </div>
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
            <span className={`text-xs font-bold ${entrega.situacao_prazo === 'atrasado' ? 'text-red-500 animate-pulse' : 'text-green-600'}`}>
                {getStatusLabel(entrega.situacao_prazo)}
            </span>
            <Link to={`/entregas/${entrega.id}/editar`} className="text-slate-400 hover:text-purple-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                <Pencil size={16} />
            </Link>
        </div>
    </div>
  );
};

const DraggableEntregaCard = ({ entrega }: { entrega: EntregaCompleta }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging 
  } = useSortable({ 
    id: entrega.id,
    data: {
      type: 'entrega',
      entrega: entrega
    }
  });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition 
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="cursor-grab active:cursor-grabbing"
    >
      <EntregaCard entrega={entrega} isDragging={isDragging} />
    </div>
  );
};

const KanbanColumn = ({ columnId, title, entregas }: { columnId: string, title: string, entregas: EntregaCompleta[] }) => {
    const { setNodeRef } = useDroppable({
      id: columnId,
      data: {
        type: 'column',
        columnId: columnId
      }
    });

    return (
        <div ref={setNodeRef} className="bg-slate-100 rounded-2xl p-4 w-80 flex-shrink-0 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-700">{title}</h3>
                <span className="bg-white rounded-full px-3 py-1 text-sm font-semibold">{entregas.length}</span>
            </div>
            <SortableContext 
              items={entregas.map(e => e.id)} 
              strategy={verticalListSortingStrategy}
            >
                <div className="overflow-y-auto h-[calc(100vh-250px)] pr-2 min-h-[200px]">
                    {entregas.length === 0 ? (
                      <div className="text-center text-slate-400 py-8">
                        Arraste cards aqui
                      </div>
                    ) : (
                      entregas.map(entrega => (
                        <DraggableEntregaCard key={entrega.id} entrega={entrega} />
                      ))
                    )}
                </div>
            </SortableContext>
        </div>
    )
}

const EntregasTableView = ({ entregas, loading }: { entregas: EntregaCompleta[], loading: boolean }) => {
  const totalFaturamento = entregas.reduce((acc, e) => e.situacao_pedido === 'entrega_realizada' ? acc + e.valor : acc, 0);

  return (
    <div>
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-lg border border-white/20">
        <p className="text-center text-slate-500">Filtros avançados em construção</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6 mb-6 shadow-lg grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm opacity-80">Total de Entregas</p>
          <p className="text-2xl font-bold">{entregas.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-80">Faturamento Total</p>
          <p className="text-2xl font-bold">{formatCurrency(totalFaturamento)}</p>
        </div>
      </div>

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
                  <td className="p-4">
                    <Link to={`/entregas/${entrega.id}/editar`} className="flex items-center gap-1 text-slate-600 hover:text-purple-600 font-semibold transition-colors">
                      <Pencil size={14} />
                      Editar
                    </Link>
                  </td>
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const { entregas, loading, refetch } = useEntregas();
  const [localEntregas, setLocalEntregas] = useState<EntregaCompleta[]>([]);

  // Sincronizar sempre que entregas mudar (ex: ao voltar para a página)
  useEffect(() => {
    console.log('📦 Entregas do banco atualizadas:', entregas.map(e => ({ id: e.id, pedido: e.numero_pedido, status: e.situacao_pedido })));
    setLocalEntregas(entregas);
  }, [entregas]);

  // Refetch ao montar o componente (quando volta pra página)
  useEffect(() => {
    console.log('🔄 Componente montado - fazendo refetch');
    refetch();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const groupedEntregas = useMemo(() => {
    const groups: Record<string, EntregaCompleta[]> = {
        'Confirmado': [], 'Pronto': [], 'Enviado': [], 'Entregue': [], 'Problemas': []
    };
    localEntregas.forEach(entrega => {
        const status = entrega.situacao_pedido;
        if (statusProblematicos.includes(status)) {
            groups['Problemas'].push(entrega);
        } else if (status === 'pedido_confirmado') {
            groups['Confirmado'].push(entrega);
        } else if (status === 'pronto_envio') {
            groups['Pronto'].push(entrega);
        } else if (status === 'enviado') {
            groups['Enviado'].push(entrega);
        } else if (status === 'entrega_realizada') {
            groups['Entregue'].push(entrega);
        } else {
            groups['Confirmado'].push(entrega);
        }
    });
    return groups;
  }, [localEntregas]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log('🟢 Drag Start:', event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    console.log('🔵 Drag End - Active:', active.id, 'Over:', over?.id);

    if (!over) return;

    const entrega = localEntregas.find(e => e.id === active.id);
    if (!entrega) return;

    let destinationColumn: string | null = null;

    if (over.data?.current?.type === 'column') {
      destinationColumn = over.data.current.columnId;
    } 
    else if (over.data?.current?.type === 'entrega') {
      const overEntrega = localEntregas.find(e => e.id === over.id);
      if (overEntrega) {
        for (const [columnName, items] of Object.entries(groupedEntregas)) {
          if (items.some(item => item.id === overEntrega.id)) {
            destinationColumn = columnName;
            break;
          }
        }
      }
    }
    else if (statusColumnMap[over.id as string]) {
      destinationColumn = over.id as string;
    }

    if (!destinationColumn) return;

    let sourceColumn: string | null = null;
    for (const [columnName, items] of Object.entries(groupedEntregas)) {
      if (items.some(item => item.id === active.id)) {
        sourceColumn = columnName;
        break;
      }
    }

    console.log('📊 Movendo de', sourceColumn, 'para', destinationColumn);

    if (sourceColumn && destinationColumn && sourceColumn !== destinationColumn) {
      const newStatus = statusColumnMap[destinationColumn];
      if (newStatus && entrega.situacao_pedido !== newStatus) {
        console.log('✅ Novo status:', newStatus);
        
        // ATUALIZAR ESTADO LOCAL PRIMEIRO
        setLocalEntregas(prev => prev.map(e => 
          e.id === entrega.id ? { ...e, situacao_pedido: newStatus } : e
        ));
        
        // Atualizar no banco SEM chamar fetchEntregas
        try {
          const { supabase } = await import('@/lib/supabase');
          const { error } = await supabase
            .from('entregas')
            .update({ situacao_pedido: newStatus })
            .eq('id', entrega.id);

          if (error) throw error;
          
          const toast = (await import('react-hot-toast')).default;
          toast.success('Status atualizado!');
        } catch (error: any) {
          const toast = (await import('react-hot-toast')).default;
          toast.error('Erro ao atualizar: ' + error.message);
          // Reverter em caso de erro
          setLocalEntregas(entregas);
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeEntrega = activeId ? localEntregas.find(e => e.id === activeId) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Truck size={36} className="text-purple-600"/> 
          <h1 className="text-3xl font-bold text-slate-800">Entregas</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-slate-200 p-1 rounded-lg flex items-center">
                <button 
                  onClick={() => setViewMode('kanban')} 
                  className={`px-4 py-2 rounded-md text-sm font-semibold ${viewMode === 'kanban' ? 'bg-white shadow' : 'text-slate-600'}`}
                >
                  <LayoutGrid size={16} className="inline mr-2"/>Kanban
                </button>
                <button 
                  onClick={() => setViewMode('table')} 
                  className={`px-4 py-2 rounded-md text-sm font-semibold ${viewMode === 'table' ? 'bg-white shadow' : 'text-slate-600'}`}
                >
                  <List size={16} className="inline mr-2"/>Tabela
                </button>
            </div>
            <Link 
              to="/entregas/novo" 
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Plus size={20} /> Nova Entrega
            </Link>
        </div>
      </div>

      {viewMode === 'kanban' && (
        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd} 
          onDragCancel={handleDragCancel}
          collisionDetection={closestCenter}
        >
            <div className="flex gap-6 w-full h-full overflow-x-auto pb-4">
                {Object.entries(groupedEntregas).map(([title, items]) => (
                    <KanbanColumn 
                      key={title} 
                      columnId={title}
                      title={title} 
                      entregas={items} 
                    />
                ))}
            </div>
            <DragOverlay>
              {activeEntrega ? (
                <div className="rotate-3 scale-105">
                  <EntregaCard entrega={activeEntrega} />
                </div>
              ) : null}
            </DragOverlay>
        </DndContext>
      )}

      {viewMode === 'table' && <EntregasTableView entregas={localEntregas} loading={loading} />}
    </motion.div>
  );
};

export default ListaEntregas;