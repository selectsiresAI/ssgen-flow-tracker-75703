import * as XLSX from 'xlsx';

export function generateImportTemplate() {
  // Aba de Coordenadores
  const coordenadoresData = [
    {
      nome: 'João Silva',
      email: 'joao.silva@exemplo.com.br'
    }
  ];

  // Aba de Representantes
  const representantesData = [
    {
      nome: 'Maria Santos',
      email: 'maria.santos@exemplo.com.br'
    }
  ];

  // Aba de Clientes
  const clientsData = [
    {
      ordem_servico_ssgen: 12345,
      data: '2024-01-15',
      nome: 'Fazenda Exemplo Ltda',
      cpf_cnpj: 12345678901234,
      representante: 'Maria Santos',
      coordenador: 'João Silva',
      ordem_servico_neogen: 67890,
      ie_rg: 123456789,
      codigo: 1001,
      status: 'Ativo',
      id_conta_ssgen: 5001
    }
  ];

  // Aba de Ordens de Serviço
  const ordersData = [
    {
      ordem_servico_ssgen: 12345,
      ordem_servico_neogen: 67890,
      nome_produto: 'Análise Genética Completa',
      numero_amostras: 50,
      cra_data: '2024-01-20',
      cra_status: 'Concluído',
      envio_planilha_data: '2024-01-16',
      envio_planilha_status: 'Enviado',
      vri_data: '2024-01-22',
      vri_n_amostras: 50,
      lpr_data: '2024-01-25',
      lpr_n_amostras: 48,
      liberacao_data: '2024-01-28',
      liberacao_n_amostras: 48,
      envio_resultados_data: '2024-01-30',
      envio_resultados_status: 'Enviado',
      envio_resultados_previsao: '2024-01-29',
      envio_resultados_data_final: '2024-01-30',
      envio_resultados_ordem_id: 1,
      envio_resultados_order_id: 1,
      envio_resultados_data_prova: 'Laudo Técnico',
      numero_nf_neogen: 9876,
      numero_teste_nota_neogen: 5432
    }
  ];

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Adicionar aba de Coordenadores
  const wsCoordenadores = XLSX.utils.json_to_sheet(coordenadoresData);
  XLSX.utils.book_append_sheet(wb, wsCoordenadores, 'Coordenadores');

  // Adicionar aba de Representantes
  const wsRepresentantes = XLSX.utils.json_to_sheet(representantesData);
  XLSX.utils.book_append_sheet(wb, wsRepresentantes, 'Representantes');

  // Adicionar aba de Clientes
  const wsClients = XLSX.utils.json_to_sheet(clientsData);
  XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes');

  // Adicionar aba de Ordens
  const wsOrders = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Ordens de Serviço');

  // Gerar arquivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  
  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template_importacao_ssgen.xlsx';
  link.click();
  URL.revokeObjectURL(url);
}
