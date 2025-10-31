import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Cliente {
  id: string
  nome: string
  cpf?: string
  cnpj?: string
  telefone: string
  email: string
  endereco: string
  cidade: string
  uf: string
  cep: string
  observacao?: string
}

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

  const createCliente = async (cliente: Omit<Cliente, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([cliente])
        .select()
        .single()

      if (error) throw error
      toast.success('Cliente cadastrado com sucesso!')
      fetchClientes() // Recarregar lista
      return data
    } catch (error: any) {
      toast.error('Erro ao cadastrar cliente: ' + error.message)
      throw error
    }
  }

  const updateCliente = async (id: string, cliente: Partial<Cliente>) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', id)

      if (error) throw error
      toast.success('Cliente atualizado com sucesso!')
      fetchClientes()
    } catch (error: any) {
      toast.error('Erro ao atualizar cliente: ' + error.message)
      throw error
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
