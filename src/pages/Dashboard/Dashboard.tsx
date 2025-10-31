import React, { useMemo, useState } from 'react';
import { useEntregas } from '@/hooks/useEntregas';
import { useClientes } from '@/hooks/useClientes';
import { useEntregadores } from '@/hooks/useEntregadores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { SituacaoPedido } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'; // Supondo que você tenha um componente de Card
import { motion } from 'framer-motion';
import { Truck, Users, UserCheck, Package, CheckCircle } from "lucide-react";


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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
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
      const isOfEntregador = entregadorId === 'todos' || entrega.entregador_id === entregadorId;
      return isAfterDataInicio && isBeforeDataFim && isOfEntregador;
    });
  }, [entregas, dataInicio, dataFim, entregadorId]);

  const kpis = useMemo(() => {
    const totalEntregas = filteredEntregas.length;
    const entregasRealizadas = filteredEntregas.filter(e => e.situacao_pedido === 'entrega_realizada').length;
    const entregasPendentes = totalEntregas - entregasRealizadas; // Simplificado
    const totalClientes = clientes.length; // Total de clientes não é afetado pelo filtro de entregas
    const totalEntregadores = entregadores.length; // Total de entregadores não é afetado pelo filtro de entregas

    return {
      totalEntregas,
      entregasRealizadas,
      entregasPendentes,
      totalClientes,
      totalEntregadores,
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

    return Object.entries(contagem).map(([name, value]) => ({ name, value }));

  }, [filteredEntregas]);


  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando dados do dashboard...</div>;
  }

  return (
    <motion.div 
      className=""
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Filtros */}
      <motion.div variants={itemVariants} className="bg-white p-4 rounded-lg shadow mb-8 flex items-center gap-4">
        <div>
          <label htmlFor="dataInicio" className="text-sm font-medium text-gray-700">Data Início</label>
          <input type="date" id="dataInicio" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="dataFim" className="text-sm font-medium text-gray-700">Data Fim</label>
          <input type="date" id="dataFim" value={dataFim} onChange={e => setDataFim(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="entregador" className="text-sm font-medium text-gray-700">Entregador</label>
          <select id="entregador" value={entregadorId} onChange={e => setEntregadorId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="todos">Todos</option>
            {entregadores.map(e => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
      </motion.div>


      {/* KPIs */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <motion.div variants={itemVariants}><KpiCard title="Total de Entregas" value={kpis.totalEntregas} icon={<Truck className="text-blue-500" />} /></motion.div>
        <motion.div variants={itemVariants}><KpiCard title="Entregas Pendentes" value={kpis.entregasPendentes} icon={<Package className="text-yellow-500" />} /></motion.div>
        <motion.div variants={itemVariants}><KpiCard title="Entregas com Sucesso" value={kpis.entregasRealizadas} icon={<CheckCircle className="text-green-500" />} /></motion.div>
        <motion.div variants={itemVariants}><KpiCard title="Total de Clientes" value={kpis.totalClientes} icon={<Users className="text-purple-500" />} /></motion.div>
        <motion.div variants={itemVariants}><KpiCard title="Total de Entregadores" value={kpis.totalEntregadores} icon={<UserCheck className="text-indigo-500" />} /></motion.div>
      </motion.div>

      {/* Gráficos */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Entregas por Status</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={entregasPorStatus} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Total de Entregas" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div variants={itemVariants} className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Entregas por Entregador</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={entregasPorEntregador} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
                {entregasPorEntregador.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};


interface KpiCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-2xl">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}


export default Dashboard;
