import { useState, useEffect } from 'react';
import { isBefore } from 'date-fns';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Entregador } from '@/types'; // Reutilizando os tipos que já definimos

// A interface pode ser estendida se precisarmos de campos computados como cnh_situacao no frontend
interface EntregadorComStatus extends Entregador {
  cnh_situacao: 'no_prazo' | 'vencida';
}

export const useEntregadores = () => {
  const [entregadores, setEntregadores] = useState<EntregadorComStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregadores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entregadores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const entregadoresComStatus = (data || []).map(entregador => ({
        ...entregador,
        cnh_situacao: isBefore(new Date(entregador.cnh_vencimento), new Date()) ? 'vencida' : 'no_prazo',
      }));

      setEntregadores(entregadoresComStatus);
    } catch (error: any) {
      toast.error('Erro ao carregar entregadores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createEntregador = async (entregador: any) => {
    try {
      const { data, error } = await supabase
        .from('entregadores')
        .insert([entregador])
        .select()
        .single();

      if (error) throw error;
      toast.success('Entregador cadastrado com sucesso!');
      fetchEntregadores(); // Recarrega a lista
      return data;
    } catch (error: any) {
      toast.error('Erro ao cadastrar entregador: ' + error.message);
      throw error;
    }
  };

  const updateEntregador = async (id: string, entregador: Partial<Entregador>) => {
    try {
      const { error } = await supabase
        .from('entregadores')
        .update(entregador)
        .eq('id', id);

      if (error) throw error;
      toast.success('Entregador atualizado com sucesso!');
      fetchEntregadores();
    } catch (error: any) {
      toast.error('Erro ao atualizar entregador: ' + error.message);
      throw error;
    }
  };

  const deleteEntregador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entregadores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Entregador excluído com sucesso!');
      fetchEntregadores();
    } catch (error: any) {
      toast.error('Erro ao excluir entregador: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchEntregadores();
  }, []);

  return {
    entregadores,
    loading,
    createEntregador,
    updateEntregador,
    deleteEntregador,
    refetch: fetchEntregadores,
  };
};