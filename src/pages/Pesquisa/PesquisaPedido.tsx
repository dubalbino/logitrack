import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, User, Truck, Calendar, DollarSign, FileText, Share2, Edit, MapPin } from 'lucide-react';
import { useEntregas } from '@/hooks/useEntregas';
import { EntregaCompleta } from '@/types';
import { formatDate, formatCurrency, getStatusLabel, getStatusColor } from '@/lib/utils';

// Placeholder for a more detailed history
const OrderHistory = ({ entrega }: { entrega: EntregaCompleta }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 mt-6">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Histórico do Pedido</h3>
        <div className="border-l-2 border-slate-200 pl-6 space-y-6">
            <div className="relative">
                <div className="absolute -left-[34px] top-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                <p className="font-semibold text-slate-700">Entrega Realizada</p>
                <p className="text-sm text-slate-500">{entrega.data_entrega_final ? formatDate(entrega.data_entrega_final) : '--'}</p>
            </div>
            <div className="relative">
                <div className="absolute -left-[34px] top-1 w-4 h-4 bg-purple-500 rounded-full border-4 border-white"></div>
                <p className="font-semibold text-slate-700">Pedido Confirmado</p>
                <p className="text-sm text-slate-500">{formatDate(entrega.data_pedido)}</p>
            </div>
        </div>
    </div>
);

const DetailsView = ({ entrega }: { entrega: EntregaCompleta }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        {/* Header do Pedido */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 mb-6 shadow-2xl">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-mono">Pedido #{entrega.numero_pedido}</p>
                    <p className="text-3xl font-bold">{entrega.descricao_compra}</p>
                </div>
                <span className={`text-lg font-bold bg-white/20 rounded-xl px-6 py-3 flex items-center gap-2`}>
                    {getStatusLabel(entrega.situacao_pedido)}
                </span>
            </div>
        </div>

        {/* Grid de Informações */}
        <div className="grid md:grid-cols-3 gap-6">
            {/* Card Pedido */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 space-y-3">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-3"><Package/> Pedido</h3>
                <p><strong>Data:</strong> {formatDate(entrega.data_pedido)}</p>
                <p><strong>Previsão:</strong> {formatDate(entrega.previsao_entrega)}</p>
                <p><strong>Valor:</strong> {formatCurrency(entrega.valor)}</p>
                <p><strong>Status:</strong> {getStatusLabel(entrega.situacao_prazo)}</p>
            </div>
            {/* Card Cliente */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 space-y-3">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-3"><User/> Cliente</h3>
                <p><strong>Nome:</strong> {entrega.cliente_nome}</p>
                <p><strong>Endereço:</strong> {entrega.cliente_uf}</p>
            </div>
            {/* Card Entregador */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 space-y-3">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-3"><Truck/> Entregador</h3>
                <p><strong>Nome:</strong> {entrega.entregador_nome}</p>
            </div>
        </div>

        <OrderHistory entrega={entrega} />

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4 mt-8">
            <button className="btn-secondary bg-red-100 text-red-700"><FileText size={16}/> Exportar PDF</button>
            <button className="btn-secondary bg-blue-100 text-blue-700"><Share2 size={16}/> Compartilhar</button>
            <button className="btn-secondary bg-purple-100 text-purple-700"><Edit size={16}/> Editar</button>
        </div>
    </motion.div>
);

const PesquisaPedido = () => {
    const { entregas, loading } = useEntregas();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntrega, setSelectedEntrega] = useState<EntregaCompleta | null>(null);

    const filteredEntregas = searchTerm
        ? entregas.filter(e => 
            e.numero_pedido.toString().includes(searchTerm) || 
            e.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : [];

    const handleSelect = (entrega: EntregaCompleta) => {
        setSelectedEntrega(entrega);
        setSearchTerm('');
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center gap-3 mb-8">
                <Search className="text-purple-600" size={36} />
                <h1 className="text-3xl font-bold text-slate-800">Pesquisa de Pedidos</h1>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 relative">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text"
                        placeholder="Buscar por número do pedido ou nome do cliente..."
                        className="w-full bg-slate-50 rounded-xl px-12 py-3 focus:ring-2 focus:ring-purple-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {searchTerm && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white shadow-lg rounded-xl z-10 max-h-60 overflow-y-auto">
                        {loading && <li className="p-4 text-slate-500">Carregando...</li>}
                        {!loading && filteredEntregas.length === 0 && <li className="p-4 text-slate-500">Nenhum resultado encontrado.</li>}
                        {filteredEntregas.map(entrega => (
                            <li key={entrega.id} onClick={() => handleSelect(entrega)} className="p-4 hover:bg-purple-50 cursor-pointer border-b">
                                <p className="font-semibold">#{entrega.numero_pedido} - {entrega.cliente_nome}</p>
                                <p className="text-sm text-slate-600">{getStatusLabel(entrega.situacao_pedido)}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selectedEntrega ? (
                <DetailsView entrega={selectedEntrega} />
            ) : (
                <div className="text-center py-20">
                    <Search size={64} className="mx-auto text-slate-300"/>
                    <h3 className="mt-4 text-lg font-semibold text-slate-500">Selecione um pedido acima para visualizar os detalhes</h3>
                </div>
            )}
        </motion.div>
    )
}

export default PesquisaPedido;