import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatCurrency(cents: number): string {
  const reais = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = parseISO(dateString)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return ''
  try {
    const date = parseISO(dateString)
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return dateString
  }
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

export function formatWhatsAppLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const encodedMessage = message ? encodeURIComponent(message) : ''
  return `https://wa.me/55${cleaned}${encodedMessage ? `?text=${encodedMessage}` : ''}`
}

export function getCentsFromReais(reais: number): number {
  return Math.round(reais * 100)
}

export function getReaisFromCents(cents: number): number {
  return cents / 100
}
