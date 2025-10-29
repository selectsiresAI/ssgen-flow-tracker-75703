import { supabase } from '@/integrations/supabase/client';
import type { Client } from '@/types/ssgen';

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
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

    // Validar formato de data
    if (client.data && !/^\d{4}-\d{2}-\d{2}$/.test(client.data)) {
      errors.push({ row, field: 'data', message: 'Formato deve ser YYYY-MM-DD' });
    }
  });

  return errors;
}

export async function importClients(clients: any[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, errors: [] };

  for (let i = 0; i < clients.length; i++) {
    try {
      const client = clients[i];
      
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

  for (let i = 0; i < representantes.length; i++) {
    try {
      const rep = representantes[i];
      
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
          .update({ email: rep.email, ativo: true })
          .eq('nome', rep.nome);

        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase
          .from('representantes')
          .insert([{ nome: rep.nome, email: rep.email, ativo: true }]);

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

  for (let i = 0; i < orders.length; i++) {
    try {
      const order = orders[i];
      
      // Verificar se o cliente existe
      const { data: client } = await supabase
        .from('clients')
        .select('ordem_servico_ssgen')
        .eq('ordem_servico_ssgen', order.ordem_servico_ssgen)
        .maybeSingle();

      if (!client) {
        throw new Error('Cliente não encontrado. Importe os clientes primeiro.');
      }

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
