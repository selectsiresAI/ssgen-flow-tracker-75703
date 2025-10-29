export type Role = 'ADM' | 'GERENTE' | 'REPRESENTANTE';

export type Profile = {
  id: string;
  email: string;
  role: Role;
  coord?: string | null;
  rep?: string | null;
};

export type PowerRow = {
  id?: string;
  Ord?: string | number;
  OS_SSGEN: string;
  DT_SSGEN_OS?: string | null;
  COD_SSB?: string | null;
  CLIENTE: string;
  LIB_CAD_CLIENTE?: string | null;
  PLAN_SSG?: string | null;
  DT_PLAN_SSG?: string | null;
  PROD_SSG?: string | null;
  N_AMOSTRAS_SSG?: number | null;
  DT_PREV_RESULT_SSG?: string | null;
  RESULT_SSG?: string | null;
  DT_RESULT_SSG?: string | null;
  FATUR_TIPO?: string | null;
  FATUR_SSG?: number | null;
  DT_FATUR_SSG?: string | null;
  REP: string;
  COORD: string;
  OS_NEOGEN?: string | null;
  PROD_NEOGEN?: string | null;
  N_AMOSTRAS_NEOGEN?: number | null;
  DT_CRA?: string | null;
  PLAN_NEOGEN?: string | null;
  DT_PLAN_NEOGEN?: string | null;
  N_VRI?: number | null;
  DT_VRI?: string | null;
  N_LPR?: number | null;
  DT_LPR?: string | null;
  N_LR?: number | null;
  DT_LR?: string | null;
  LR_RASTREIO?: string | null;
  NF_NEOGEM?: string | null;
  NF_NA_NEOGEN?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const isSet = (v: any) => v !== null && v !== undefined && v !== '';

export const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString() : '—';

export const dBetween = (a?: string | null, b?: string | null) => {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
};

export const slaBadge = (row: PowerRow) => {
  const tgt = row.DT_PREV_RESULT_SSG;
  if (!tgt) return { label: '—', tone: 'secondary' } as const;
  const d = dBetween(tgt, new Date().toISOString().slice(0, 10));
  if (d === null) return { label: '—', tone: 'secondary' } as const;
  if (d < 0) return { label: `${d}d`, tone: 'success' } as const;
  if (d === 0) return { label: 'D0', tone: 'warning' } as const;
  return { label: `+${d}d`, tone: 'destructive' } as const;
};

// Novos tipos para Clientes e Ordens de Serviço
export type Client = {
  ordem_servico_ssgen: number;
  data: string;
  ordem_servico_neogen?: number | null;
  nome: string;
  cpf_cnpj: number;
  ie_rg?: number | null;
  codigo?: number | null;
  status?: string | null;
  representante: string;
  coordenador: string;
  id_conta_ssgen?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type ServiceOrder = {
  id?: string;
  ordem_servico_ssgen: number;
  ordem_servico_neogen?: number | null;
  numero_nf_neogen?: number | null;
  numero_teste_nota_neogen?: number | null;
  nome_produto?: string | null;
  numero_amostras?: number | null;
  
  // CRA
  cra_data?: string | null;
  cra_status?: string | null;
  
  // Envio Planilha
  envio_planilha_data?: string | null;
  envio_planilha_status?: string | null;
  
  // VRI
  vri_data?: string | null;
  vri_n_amostras?: number | null;
  
  // LPR
  lpr_data?: string | null;
  lpr_n_amostras?: number | null;
  
  // Liberação
  liberacao_data?: string | null;
  liberacao_n_amostras?: number | null;
  
  // Envio Resultados
  envio_resultados_data?: string | null;
  envio_resultados_ordem_id?: number | null;
  envio_resultados_previsao?: string | null;
  envio_resultados_status?: string | null;
  envio_resultados_data_final?: string | null;
  envio_resultados_data_prova?: string | null;
  envio_resultados_order_id?: number | null;
  
  created_at?: string;
  updated_at?: string;
};

export type UnifiedOrder = Client & Omit<ServiceOrder, 'ordem_servico_ssgen' | 'ordem_servico_neogen' | 'created_at' | 'updated_at'> & {
  ordem_id?: string;
  cliente_nome?: string;
  cliente_status?: string;
  data_cadastro?: string;
  client_created_at?: string;
  order_created_at?: string;
  updated_at?: string;
};
