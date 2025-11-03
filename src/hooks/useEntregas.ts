import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Entrega, EntregaCompleta } from '@/types';

export const useEntregas = () => {
  const [entregas, setEntregas] = useState<EntregaCompleta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entregas_completa') // Usando a VIEW com campos computados
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntregas(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar entregas: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntrega = async (entrega: any) => {
    try {
      const { data, error } = await supabase
        .from('entregas') // Inserir na tabela principal
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

  const updateEntrega = async (id: string, updates: Partial<Entrega>) => {
    try {
      const { error } = await supabase
        .from('entregas') // Atualizar na tabela principal
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Entrega atualizada com sucesso!');
      fetchEntregas();
    } catch (error: any) {
      toast.error('Erro ao atualizar entrega: ' + error.message);
      throw error;
    }
  };

  const deleteEntrega = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entregas') // Deletar da tabela principal
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