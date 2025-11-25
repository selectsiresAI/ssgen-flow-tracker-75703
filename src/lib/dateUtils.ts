/**
 * Utilitários para formatação de datas no padrão brasileiro
 */

/**
 * Formata uma data no padrão brasileiro DD/MM/YYYY
 * @param dateString - String de data ISO ou timestamp
 * @returns Data formatada ou "—" se inválida
 */
export const formatDateBR = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
  } catch {
    return '—';
  }
};

/**
 * Formata uma data e hora no padrão brasileiro DD/MM/YYYY HH:mm:ss
 * @param dateString - String de data ISO ou timestamp
 * @returns Data e hora formatada ou "—" se inválida
 */
export const formatDateTimeBR = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch {
    return '—';
  }
};

/**
 * Formata uma data e hora no padrão brasileiro DD/MM/YYYY HH:mm (sem segundos)
 * @param dateString - String de data ISO ou timestamp
 * @returns Data e hora formatada ou "—" se inválida
 */
export const formatDateTimeShortBR = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch {
    return '—';
  }
};

/**
 * Converte uma data do formato ISO para YYYY-MM-DD (para inputs type="date")
 * @param dateString - String de data ISO
 * @returns Data no formato YYYY-MM-DD ou string vazia
 */
export const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Usar timezone de São Paulo para evitar problemas de conversão
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Formata valores monetários no padrão brasileiro
 * @param value - Valor numérico
 * @returns Valor formatado como R$ X.XXX,XX
 */
export const formatCurrencyBR = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

/**
 * Formata números no padrão brasileiro
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns Número formatado
 */
export const formatNumberBR = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
