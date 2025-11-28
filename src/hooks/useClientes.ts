import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

import { Cliente } from '@/types';

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createCliente = async (formData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error('Você precisa estar logado para cadastrar um cliente.');
        throw new Error('User not authenticated');
    }

    // O formData do formulário inclui 'tipo_pessoa', que não existe na tabela.
    // Também precisamos adicionar o user_id do usuário logado.
    const { tipo_pessoa, ...clienteData } = formData;
    
    const clienteParaInserir = {
      ...clienteData,
      user_id: user.id
    };

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([clienteParaInserir]) // Usamos o objeto limpo
        .select()
        .single();

      if (error) throw error;
      toast.success('Cliente cadastrado com sucesso!');
      fetchClientes(); // Recarregar lista
      return data;
    } catch (error: any) {
      toast.error('Erro ao cadastrar cliente: ' + error.message);
      throw error;
    }
  }

  const updateCliente = async (id: string, formData: Partial<Cliente>) => {
    // Remove campos que não devem ser atualizados diretamente ou não existem na tabela
    const { tipo_pessoa, ...clienteData } = formData as any;

    try {
      const { error } = await supabase
        .from('clientes')
        .update(clienteData) // Usamos o objeto limpo
        .eq('id', id);

      if (error) {
        throw error;
      }
      toast.success('Cliente atualizado com sucesso!');
      fetchClientes();
    } catch (error: any) {
      toast.error('Erro ao atualizar cliente: ' + error.message);
      throw error;
    }
  }

  const deleteCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Cliente excluído com sucesso!')
      fetchClientes()
    } catch (error: any) {
      toast.error('Erro ao excluir cliente: ' + error.message)
      throw error
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  return {
    clientes,
    loading,
    createCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes
  }
}
