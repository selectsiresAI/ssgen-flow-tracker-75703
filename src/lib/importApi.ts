import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/ssgen';
import { requireAdmin } from '@/lib/ssgenClient';

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Função auxiliar para limpar e formatar CPF/CNPJ
function cleanCpfCnpj(value: any): number | null {
  if (!value) return null;
  const cleaned = String(value).replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
}

// Função auxiliar para converter data do Excel para YYYY-MM-DD
function parseExcelDate(value: any): string | null {
  if (!value) return null;
  
  // Se já está no formato correto YYYY-MM-DD
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  // Se é uma data do Excel (número)
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // Tentar parsear formato M/D/YY ou M/D/YYYY
  if (typeof value === 'string') {
    const parts = value.split('/');
    if (parts.length === 3) {
      let [month, day, year] = parts;
      
      // Converter ano de 2 dígitos para 4 dígitos
      if (year.length === 2) {
        const yearNum = parseInt(year, 10);
        year = yearNum < 50 ? `20${year}` : `19${year}`;
      }
      
      // Garantir 2 dígitos para mês e dia
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
  }
  
  return null;
}

// Função auxiliar para limpar ordem de serviço
function cleanOrderNumber(value: any): number | null {
  if (!value) return null;
  const cleaned = String(value).replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : null;
}

export async function validateClients(clients: any[]): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  
  // Buscar coordenadores e representantes válidos
  const { data: coordenadores } = await supabase
    .from('coordenadores')
    .select('nome')
    .eq('ativo', true);
  
  const { data: representantes } = await supabase
    .from('representantes')
    .select('nome')
    .eq('ativo', true);
  
  const validCoords = new Set(coordenadores?.map(c => c.nome) || []);
  const validReps = new Set(representantes?.map(r => r.nome) || []);

  clients.forEach((client, index) => {
    const row = index + 2; // +2 porque linha 1 é header e index começa em 0

    // Validações obrigatórias
    if (!client.ordem_servico_ssgen) {
      errors.push({ row, field: 'ordem_servico_ssgen', message: 'Campo obrigatório' });
    }
    if (!client.nome) {
      errors.push({ row, field: 'nome', message: 'Campo obrigatório' });
    }
    if (!client.cpf_cnpj) {
      errors.push({ row, field: 'cpf_cnpj', message: 'Campo obrigatório' });
    }
    if (!client.representante) {
      errors.push({ row, field: 'representante', message: 'Campo obrigatório' });
    }
    if (!client.coordenador) {
      errors.push({ row, field: 'coordenador', message: 'Campo obrigatório' });
    }
    if (!client.data) {
      errors.push({ row, field: 'data', message: 'Campo obrigatório' });
    }

    // Validar se coordenador existe
    if (client.coordenador && !validCoords.has(client.coordenador)) {
      errors.push({ row, field: 'coordenador', message: `Coordenador "${client.coordenador}" não encontrado` });
    }

    // Validar se representante existe
    if (client.representante && !validReps.has(client.representante)) {
      errors.push({ row, field: 'representante', message: `Representante "${client.representante}" não encontrado` });
    }
  });

  return errors;
}

export async function importClients(clients: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] };
  await requireAdmin();

  for (let i = 0; i < clients.length; i++) {
    try {
      const rawClient = clients[i];
      
      // Limpar e formatar dados
      const client = {
        ordem_servico_ssgen: cleanOrderNumber(rawClient.ordem_servico_ssgen),
        data: parseExcelDate(rawClient.data),
        nome: rawClient.nome,
        cpf_cnpj: cleanCpfCnpj(rawClient.cpf_cnpj),
        representante: rawClient.representante,
        coordenador: rawClient.coordenador,
        ordem_servico_neogen: cleanOrderNumber(rawClient.ordem_servico_neogen),
        ie_rg: cleanCpfCnpj(rawClient.ie_rg),
        codigo: rawClient.codigo ? parseInt(String(rawClient.codigo), 10) : null,
        status: rawClient.status || null,
        id_conta_ssgen: rawClient.id_conta_ssgen ? parseInt(String(rawClient.id_conta_ssgen), 10) : null,
        deleted_at: null,
      };
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('clients')
        .select('ordem_servico_ssgen')
        .eq('ordem_servico_ssgen', client.ordem_servico_ssgen)
        .maybeSingle();

      if (existing) {
        // Atualizar se já existe
        const { error } = await supabase
          .from('clients')
          .update(client)
          .eq('ordem_servico_ssgen', client.ordem_servico_ssgen);

        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('clients')
          .insert([client]);

        if (error) throw error;
      }

      result.success++;
    } catch (error: any) {
      result.errors.push({
        row: i + 2,
        error: error.message,
        data: clients[i]
      });
    }
  }

  return result;
}

export async function importCoordenadores(coordenadores: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] };
  await requireAdmin();

  for (let i = 0; i < coordenadores.length; i++) {
    try {
      const coord = coordenadores[i];
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('coordenadores')
        .select('id')
        .eq('nome', coord.nome)
        .maybeSingle();

      if (existing) {
        // Atualizar se já existe
        const { error } = await supabase
          .from('coordenadores')
          .update({ email: coord.email, ativo: true })
          .eq('nome', coord.nome);

        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('coordenadores')
          .insert([{ nome: coord.nome, email: coord.email, ativo: true }]);

        if (error) throw error;
      }

      result.success++;
    } catch (error: any) {
      result.errors.push({
        row: i + 2,
        error: error.message,
        data: coordenadores[i]
      });
    }
  }

  return result;
}

export async function importRepresentantes(representantes: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] };
  await requireAdmin();

  for (let i = 0; i < representantes.length; i++) {
    try {
      const rep = representantes[i];
      const coordenadorNome = rep.coordenador_nome || rep.coordenador || null;

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('representantes')
        .select('id')
        .eq('nome', rep.nome)
        .maybeSingle();

      if (existing) {
        // Atualizar se já existe
        const { error } = await supabase
          .from('representantes')
          .update({ email: rep.email, ativo: true, coordenador_nome: coordenadorNome })
          .eq('nome', rep.nome);

        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('representantes')
          .insert([{ nome: rep.nome, email: rep.email, ativo: true, coordenador_nome: coordenadorNome }]);

        if (error) throw error;
      }

      result.success++;
    } catch (error: any) {
      result.errors.push({
        row: i + 2,
        error: error.message,
        data: representantes[i]
      });
    }
  }

  return result;
}

export async function importServiceOrders(orders: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] };
  await requireAdmin();

  for (let i = 0; i < orders.length; i++) {
    try {
      const rawOrder = orders[i];
      
      // Limpar e formatar dados
      const orderNumber = cleanOrderNumber(rawOrder.ordem_servico_ssgen);
      
      // Verificar se o cliente existe
      const { data: client } = await supabase
        .from('clients')
        .select('ordem_servico_ssgen')
        .eq('ordem_servico_ssgen', orderNumber)
        .maybeSingle();

      if (!client) {
        throw new Error('Cliente não encontrado. Importe os clientes primeiro.');
      }

      const order = {
        ordem_servico_ssgen: orderNumber,
        ordem_servico_neogen: cleanOrderNumber(rawOrder.ordem_servico_neogen),
        numero_nf_neogen: rawOrder.numero_nf_neogen ? parseInt(String(rawOrder.numero_nf_neogen), 10) : null,
        nome_produto: rawOrder.nome_produto || null,
        numero_amostras: rawOrder.numero_amostras ? parseInt(String(rawOrder.numero_amostras), 10) : null,
        cra_data: parseExcelDate(rawOrder.cra_data),
        cra_status: rawOrder.cra_status || null,
        envio_planilha_data: parseExcelDate(rawOrder.envio_planilha_data),
        envio_planilha_status: rawOrder.envio_planilha_status || null,
        vri_data: parseExcelDate(rawOrder.vri_data),
        vri_n_amostras: rawOrder.vri_n_amostras ? parseInt(String(rawOrder.vri_n_amostras), 10) : null,
        lpr_data: parseExcelDate(rawOrder.lpr_data),
        lpr_n_amostras: rawOrder.lpr_n_amostras ? parseInt(String(rawOrder.lpr_n_amostras), 10) : null,
        liberacao_data: parseExcelDate(rawOrder.liberacao_data),
        liberacao_n_amostras: rawOrder.liberacao_n_amostras ? parseInt(String(rawOrder.liberacao_n_amostras), 10) : null,
        envio_resultados_data: parseExcelDate(rawOrder.envio_resultados_data),
        envio_resultados_previsao: parseExcelDate(rawOrder.envio_resultados_previsao),
        envio_resultados_status: rawOrder.envio_resultados_status || null,
        envio_resultados_data_prova: rawOrder.envio_resultados_data_prova || null,
        deleted_at: null,
      };

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('service_orders')
        .select('id')
        .eq('ordem_servico_ssgen', order.ordem_servico_ssgen)
        .maybeSingle();

      if (existing) {
        // Atualizar se já existe
        const { error } = await supabase
          .from('service_orders')
          .update(order)
          .eq('ordem_servico_ssgen', order.ordem_servico_ssgen);

        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('service_orders')
          .insert([order]);

        if (error) throw error;
      }

      result.success++;
    } catch (error: any) {
      result.errors.push({
        row: i + 2,
        error: error.message,
        data: orders[i]
      });
    }
  }

  return result;
}
