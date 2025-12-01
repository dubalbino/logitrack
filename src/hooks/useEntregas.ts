import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Entrega, EntregaCompleta, SituacaoPrazo } from '@/types';

export const useEntregas = () => {
  const [entregas, setEntregas] = useState<EntregaCompleta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregas = useCallback(async () => {

    try {
      setLoading(true);
      
      // Buscar da tabela entregas com joins
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          *,
          clientes:cliente_id(nome, uf, cep),
          entregadores:entregador_id(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear para o formato EntregaCompleta
      const mapped: EntregaCompleta[] = (data || []).map(e => {
        let situacao_prazo: SituacaoPrazo = 'no_prazo'; // default
        
        return {
          id: e.id,
          created_at: e.created_at,
          numero_pedido: e.numero_pedido,
          data_pedido: e.data_pedido,
          previsao_entrega: e.previsao_entrega,
          cliente_id: e.cliente_id,
          descricao_compra: e.descricao_compra,
          valor: e.valor,
          situacao_pedido: e.situacao_pedido || 'pedido_confirmado', // Fallback
          entregador_id: e.entregador_id,
          data_entrega_final: e.data_entrega_final,
          observacao: e.observacao,
          user_id: e.user_id,
          origem: e.origem,
          destino: e.destino,
          codigo_rastreio: e.codigo_rastreio,
          // Campos computados/relacionados
          cliente_nome: e.clientes?.nome || 'Cliente não encontrado',
          cliente_uf: e.clientes?.uf || '',
          cliente_cep: e.clientes?.cep || '',
          entregador_nome: e.entregadores?.nome || 'Entregador não encontrado',
          // Campos que podem vir da VIEW (se precisar calcular manualmente)
          prazo_maximo: 0,
          prazo_decorrido: 0,
          situacao_prazo: situacao_prazo, // Usando a variável calculada
          codigo_pedido: `PED-${e.numero_pedido}`,
          mes: new Date(e.data_pedido).toLocaleString('pt-BR', { month: 'long' }),
          ano: new Date(e.data_pedido).getFullYear().toString(),
        };
      });
      
      console.log('✅ Entregas carregadas:', mapped.map(e => ({ 
        id: e.id, 
        pedido: e.numero_pedido, 
        status: e.situacao_pedido
      })));
      
      setEntregas(mapped);
    } catch (error: any) {
      console.error('❌ Erro ao carregar entregas:', error);
      toast.error('Erro ao carregar entregas: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntrega = async (entrega: any) => {
    try {
      const { data, error } = await supabase
        .from('entregas')
        .insert([entrega])
        .select()
        .single();

      if (error) throw error;
      toast.success('Entrega cadastrada com sucesso!');
      fetchEntregas();
      return data;
    } catch (error: any) {
      toast.error('Erro ao cadastrar entrega: ' + error.message);
      throw error;
    }
  };

  const updateEntrega = async (id: string, updates: Partial<Entrega>, skipRefetch = false) => {
    try {
      const { error } = await supabase
        .from('entregas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      console.log(`✅ Entrega ${id} atualizada no banco`, updates);
      
      toast.success('Entrega atualizada com sucesso!');
      
      // Só faz refetch se skipRefetch for false
      if (!skipRefetch) {
        await fetchEntregas();
      }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar entrega:', error);
      toast.error('Erro ao atualizar entrega: ' + error.message);
      throw error;
    }
  };

  const deleteEntrega = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entregas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Entrega excluída com sucesso!');
      fetchEntregas();
    } catch (error: any) {
      toast.error('Erro ao excluir entrega: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchEntregas();
  }, [fetchEntregas]);

  return {
    entregas,
    loading,
    createEntrega,
    updateEntrega,
    deleteEntrega,
    refetch: fetchEntregas,
  };
};