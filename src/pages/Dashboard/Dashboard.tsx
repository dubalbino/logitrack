import React, { useMemo, useState } from 'react';
import { useEntregas } from '@/hooks/useEntregas';
import { useClientes } from '@/hooks/useClientes';
import { useEntregadores } from '@/hooks/useEntregadores';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { SituacaoPedido } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { 
  Truck, Users, UserCheck, Package, CheckCircle, AlertTriangle, 
  DollarSign, TrendingUp, TrendingDown, Clock, MapPin, Calendar
} from "lucide-react";
import { formatCurrency } from '@/lib/utils';

const statusTraduzido: Record<SituacaoPedido, string> = {
  pedido_confirmado: 'Confirmado',
  pronto_envio: 'Pronto p/ Envio',
  enviado: 'Enviado',
  entrega_realizada: 'Entregue',
  entrega_sem_sucesso: 'Sem Sucesso',
  devolvido_remetente: 'Devolvido',
  avariado: 'Avariado',
  extravio: 'Extravio',
};

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

const Dashboard: React.FC = () => {
  const { entregas, loading: loadingEntregas } = useEntregas();
  const { clientes, loading: loadingClientes } = useClientes();
  const { entregadores, loading: loadingEntregadores } = useEntregadores();

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [entregadorId, setEntregadorId] = useState('todos');

  const loading = loadingEntregas || loadingClientes || loadingEntregadores;

  const filteredEntregas = useMemo(() => {
    return entregas.filter(entrega => {
      const dataEntrega = new Date(entrega.data_pedido);
      const isAfterDataInicio = !dataInicio || dataEntrega >= new Date(dataInicio);
      const isBeforeDataFim = !dataFim || dataEntrega <= new Date(dataFim);
      const isOfEntregador = entregadorId === 'todos' || entrega.entregador_id === entregadorId || String(entrega.entregador_id) === String(entregadorId);
      return isAfterDataInicio && isBeforeDataFim && isOfEntregador;
    });
  }, [entregas, dataInicio, dataFim, entregadorId]);

  const kpis = useMemo(() => {
    const totalEntregas = filteredEntregas.length;
    const entregasRealizadas = filteredEntregas.filter(e => e.situacao_pedido === 'entrega_realizada').length;
    const entregasComProblema = filteredEntregas.filter(e => 
      ['entrega_sem_sucesso', 'devolvido_remetente', 'avariado', 'extravio'].includes(e.situacao_pedido)
    ).length;
    const entregasPendentes = filteredEntregas.filter(e => 
      !['entrega_realizada', 'entrega_sem_sucesso', 'devolvido_remetente', 'avariado', 'extravio'].includes(e.situacao_pedido)
    ).length;
    const entregasAtrasadas = filteredEntregas.filter(e => e.situacao_prazo === 'atrasado').length;

    const faturamentoTotal = filteredEntregas.reduce((acc, e) => acc + e.valor, 0);
    const faturamentoRealizado = filteredEntregas
      .filter(e => e.situacao_pedido === 'entrega_realizada')
      .reduce((acc, e) => acc + e.valor, 0);
    const faturamentoPendente = faturamentoTotal - faturamentoRealizado;

    const taxaSucesso = totalEntregas > 0 ? (entregasRealizadas / totalEntregas) * 100 : 0;
    const ticketMedio = totalEntregas > 0 ? faturamentoTotal / totalEntregas : 0;

    return {
      totalEntregas,
      entregasRealizadas,
      entregasPendentes,
      entregasComProblema,
      entregasAtrasadas,
      faturamentoTotal,
      faturamentoRealizado,
      faturamentoPendente,
      taxaSucesso,
      ticketMedio,
      totalClientes: clientes.length,
      totalEntregadores: entregadores.length,
    };
  }, [filteredEntregas, clientes, entregadores]);

  const entregasPorStatus = useMemo(() => {
    const contagem = filteredEntregas.reduce((acc, entrega) => {
      const status = entrega.situacao_pedido;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<SituacaoPedido, number>);

    return Object.entries(contagem).map(([status, total]) => ({
      name: statusTraduzido[status as SituacaoPedido],
      total,
    }));
  }, [filteredEntregas]);

  const entregasPorEntregador = useMemo(() => {
    const contagem = filteredEntregas.reduce((acc, entrega) => {
      const entregador = entrega.entregador_nome || 'Não atribuído';
      acc[entregador] = (acc[entregador] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(contagem)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredEntregas]);

  const entregasPorMes = useMemo(() => {
    const contagem = filteredEntregas.reduce((acc, entrega) => {
      const mes = new Date(entrega.data_pedido).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!acc[mes]) {
        acc[mes] = { mes, entregas: 0, faturamento: 0 };
      }
      acc[mes].entregas += 1;
      acc[mes].faturamento += entrega.valor;
      return acc;
    }, {} as Record<string, { mes: string, entregas: number, faturamento: number }>);

    return Object.values(contagem).sort((a, b) => {
      const [mesA, anoA] = a.mes.split(' ');
      const [mesB, anoB] = b.mes.split(' ');
      return new Date(`20${anoA}-${mesA}`).getTime() - new Date(`20${anoB}-${mesB}`).getTime();
    });
  }, [filteredEntregas]);

  const entregasPorUF = useMemo(() => {
    const contagem = filteredEntregas.reduce((acc, entrega) => {
      const uf = entrega.cliente_uf || 'N/A';
      acc[uf] = (acc[uf] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(contagem)
      .map(([uf, total]) => ({ uf, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredEntregas]);

  const topEntregadores = useMemo(() => {
    const stats = filteredEntregas.reduce((acc, entrega) => {
      const id = entrega.entregador_id;
      const nome = entrega.entregador_nome || 'Não atribuído';
      
      if (!acc[id]) {
        acc[id] = { nome, total: 0, sucesso: 0, faturamento: 0 };
      }
      
      acc[id].total += 1;
      acc[id].faturamento += entrega.valor;
      if (entrega.situacao_pedido === 'entrega_realizada') {
        acc[id].sucesso += 1;
      }
      
      return acc;
    }, {} as Record<string, { nome: string, total: number, sucesso: number, faturamento: number }>);

    return Object.values(stats)
      .map(e => ({ ...e, taxaSucesso: e.total > 0 ? (e.sucesso / e.total) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredEntregas]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Dashboard</h1>
        <div className="text-sm text-slate-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Filtros Modernos */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl shadow-lg border border-purple-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <Calendar size={16} /> Data Início
            </label>
            <input 
              type="date" 
              value={dataInicio} 
              onChange={e => setDataInicio(e.target.value)} 
              className="w-full rounded-xl border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <Calendar size={16} /> Data Fim
            </label>
            <input 
              type="date" 
              value={dataFim} 
              onChange={e => setDataFim(e.target.value)} 
              className="w-full rounded-xl border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <UserCheck size={16} /> Entregador
            </label>
            <select 
              value={entregadorId} 
              onChange={e => setEntregadorId(e.target.value)} 
              className="w-full rounded-xl border-slate-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 px-4 py-2"
            >
              <option value="todos">Todos os Entregadores</option>
              {entregadores.map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* KPIs Principais - 3 linhas */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Faturamento Total" 
            value={formatCurrency(kpis.faturamentoTotal)} 
            icon={<DollarSign />}
            color="green"
            subtitle={`Realizado: ${formatCurrency(kpis.faturamentoRealizado)}`}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Faturamento Pendente" 
            value={formatCurrency(kpis.faturamentoPendente)} 
            icon={<Clock />}
            color="orange"
            subtitle={`${((kpis.faturamentoPendente/kpis.faturamentoTotal)*100).toFixed(1)}% do total`}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Ticket Médio" 
            value={formatCurrency(kpis.ticketMedio)} 
            icon={<TrendingUp />}
            color="purple"
            subtitle="Por entrega"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Taxa de Sucesso" 
            value={`${kpis.taxaSucesso.toFixed(1)}%`} 
            icon={<CheckCircle />}
            color="blue"
            subtitle={`${kpis.entregasRealizadas} de ${kpis.totalEntregas}`}
          />
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Total de Entregas" 
            value={kpis.totalEntregas} 
            icon={<Truck />}
            color="blue"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Entregas Pendentes" 
            value={kpis.entregasPendentes} 
            icon={<Package />}
            color="yellow"
            trend="neutral"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Com Problemas" 
            value={kpis.entregasComProblema} 
            icon={<AlertTriangle />}
            color="red"
            trend="down"
            subtitle={`${((kpis.entregasComProblema/kpis.totalEntregas)*100).toFixed(1)}% do total`}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Entregas Atrasadas" 
            value={kpis.entregasAtrasadas} 
            icon={<Clock />}
            color="red"
            trend="down"
          />
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Entregas Realizadas" 
            value={kpis.entregasRealizadas} 
            icon={<CheckCircle />}
            color="green"
            trend="up"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Total de Clientes" 
            value={kpis.totalClientes} 
            icon={<Users />}
            color="purple"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard 
            title="Total de Entregadores" 
            value={kpis.totalEntregadores} 
            icon={<UserCheck />}
            color="indigo"
          />
        </motion.div>
      </motion.div>

      {/* Gráficos - Grid 2x2 */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Entregas por Status</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={entregasPorStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="total" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Entregas por Entregador</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie 
                data={entregasPorEntregador} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={120} 
                label={(entry) => `${entry.name}: ${entry.value}`}
                labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
              >
                {entregasPorEntregador.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Evolução Mensal</h2>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={entregasPorMes}>
              <defs>
                <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="entregas" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorEntregas)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Top Estados (UF)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={entregasPorUF} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" />
              <YAxis dataKey="uf" type="category" width={50} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="total" fill="#06b6d4" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* Top Entregadores */}
      <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UserCheck className="text-purple-600" /> Top 5 Entregadores
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-700">Entregador</th>
                <th className="text-center p-3 font-semibold text-slate-700">Total</th>
                <th className="text-center p-3 font-semibold text-slate-700">Sucesso</th>
                <th className="text-center p-3 font-semibold text-slate-700">Taxa</th>
                <th className="text-right p-3 font-semibold text-slate-700">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {topEntregadores.map((e, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-purple-50 transition">
                  <td className="p-3 font-medium text-slate-800">{e.nome}</td>
                  <td className="p-3 text-center text-slate-600">{e.total}</td>
                  <td className="p-3 text-center text-green-600 font-semibold">{e.sucesso}</td>
                  <td className="p-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      e.taxaSucesso >= 90 ? 'bg-green-100 text-green-700' : 
                      e.taxaSucesso >= 70 ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {e.taxaSucesso.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-purple-600">{formatCurrency(e.faturamento)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'orange' | 'indigo';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color = 'blue', trend, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-orange-500',
    yellow: 'from-yellow-500 to-orange-500',
    orange: 'from-orange-500 to-red-500',
    indigo: 'from-indigo-500 to-purple-500',
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className={`bg-gradient-to-br ${colorClasses[color]} text-white pb-3`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
          <div className="text-2xl opacity-90">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-slate-800">{value}</div>
          {trend && (
            <div className="flex items-center">
              {trend === 'up' && <TrendingUp className="text-green-500" size={20} />}
              {trend === 'down' && <TrendingDown className="text-red-500" size={20} />}
            </div>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default Dashboard;