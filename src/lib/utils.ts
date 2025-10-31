import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar data
export const formatDate = (date: string | Date, formatStr = 'dd/MM/yyyy') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ptBR })
}

// Formatar moeda
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Validar CPF
export const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.substring(10, 11))) return false

  return true
}

// Validar CNPJ
export const validateCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false

  let length = cnpj.length - 2
  let numbers = cnpj.substring(0, length)
  const digits = cnpj.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  length = length + 1
  numbers = cnpj.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

// Buscar CEP (ViaCEP API)
export const fetchCEP = async (cep: string) => {
  try {
    const cleanCEP = cep.replace(/\D/g, '')
    if (cleanCEP.length !== 8) throw new Error('CEP inválido')

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
    const data = await response.json()

    if (data.erro) throw new Error('CEP não encontrado')

    return {
      endereco: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
      cep: data.cep
    }
  } catch (error) {
    throw error
  }
}

// Calcular prazo
export const calcularPrazo = (dataInicio: Date, dataFim: Date) => {
  const diff = dataFim.getTime() - dataInicio.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Status colors
export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'pedido_confirmado': 'bg-blue-100 text-blue-700',
    'pronto_envio': 'bg-orange-100 text-orange-700',
    'enviado': 'bg-yellow-100 text-yellow-700',
    'entrega_realizada': 'bg-green-100 text-green-700',
    'entrega_sem_sucesso': 'bg-red-100 text-red-700',
    'devolvido_remetente': 'bg-purple-100 text-purple-700',
    'avariado': 'bg-red-100 text-red-700',
    'extravio': 'bg-gray-100 text-gray-700',
    'no_prazo': 'bg-green-100 text-green-700',
    'atrasado': 'bg-red-100 text-red-700',
    'entregue_prazo': 'bg-green-50 text-green-600',
    'entregue_atraso': 'bg-orange-100 text-orange-700'
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

// Status labels
export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'pedido_confirmado': 'Pedido Confirmado',
    'pronto_envio': 'Pronto para Envio',
    'enviado': 'Enviado',
    'entrega_realizada': 'Entrega Realizada',
    'entrega_sem_sucesso': 'Entrega Sem Sucesso',
    'devolvido_remetente': 'Devolvido ao Remetente',
    'avariado': 'Avariado',
    'extravio': 'Extravio',
    'no_prazo': 'No Prazo',
    'atrasado': 'Atrasado',
    'entregue_prazo': 'Entregue no Prazo',
    'entregue_atraso': 'Entregue com Atraso'
  }
  return labels[status] || status
}

// Debounce
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Gerar iniciais
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Estados brasileiros
export const ESTADOS_BR = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
]
