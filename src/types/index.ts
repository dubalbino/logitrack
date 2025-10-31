export interface Cliente {
  id: string
  created_at: string
  data_cadastro: string
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
  user_id: string
}

export interface Entregador {
  id: string
  created_at: string
  data_cadastro: string
  nome: string
  telefone: string
  email: string
  veiculo_modelo: string
  veiculo_placa: string
  cnh_numero: string
  cnh_vencimento: string
  observacao?: string
  user_id: string
}

export interface Entrega {
  id: string
  created_at: string
  numero_pedido: number
  data_pedido: string
  previsao_entrega: string
  cliente_id: string
  descricao_compra: string
  valor: number
  situacao_pedido: SituacaoPedido
  entregador_id: string
  data_entrega_final?: string
  observacao?: string
  user_id: string
}

export interface EntregaCompleta extends Entrega {
  cliente_nome: string
  cliente_uf: string
  cliente_cep: string
  entregador_nome: string
  prazo_maximo: number
  prazo_decorrido: number
  situacao_prazo: SituacaoPrazo
  codigo_pedido: string
  mes: string
  ano: string
}

export type SituacaoPedido =
  | 'pedido_confirmado'
  | 'pronto_envio'
  | 'enviado'
  | 'entrega_realizada'
  | 'entrega_sem_sucesso'
  | 'devolvido_remetente'
  | 'avariado'
  | 'extravio'

export type SituacaoPrazo =
  | 'no_prazo'
  | 'atrasado'
  | 'entregue_prazo'
  | 'entregue_atraso'

export interface DashboardStats {
  totalFaturamento: number
  totalEntregas: number
  entregasPendentes: number
  taxaSucesso: number
  entregasHoje: number
}

export interface FiltroEntregas {
  searchTerm?: string
  situacao?: SituacaoPedido[]
  entregador?: string
  dataInicio?: string
  dataFim?: string
  situacaoPrazo?: SituacaoPrazo[]
  uf?: string
}
