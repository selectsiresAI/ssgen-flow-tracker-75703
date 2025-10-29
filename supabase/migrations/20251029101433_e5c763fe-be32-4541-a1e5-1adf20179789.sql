-- Fase 6: Dados Demo para testes

-- Inserir ordens de exemplo
INSERT INTO public.orders (
  ord, os_ssgen, dt_ssgen_os, cliente, rep, coord,
  dt_prev_result_ssg, prod_ssg, n_amostras_ssg, plan_ssg, dt_plan_ssg,
  os_neogen, dt_cra, plan_neogen, dt_plan_neogen, n_vri, dt_vri
) VALUES
  (
    '001', 'OS-2024-001', '2024-01-15', 'Fazenda Sol Nascente', 
    'João Silva', 'COORD-SUL',
    '2024-02-15', 'Análise de Solo Premium', 5, 'Laboratório A', '2024-01-20',
    'NEO-2024-001', '2024-01-18', 'Lab Neogen', '2024-01-22', 3, '2024-01-25'
  ),
  (
    '002', 'OS-2024-002', '2024-01-16', 'Agropecuária Campos Verdes',
    'Maria Santos', 'COORD-NORTE', 
    '2024-02-20', 'Análise de Solo Básica', 3, 'Laboratório B', '2024-01-21',
    'NEO-2024-002', '2024-01-19', 'Lab Neogen', '2024-01-23', 2, '2024-01-26'
  ),
  (
    '003', 'OS-2024-003', '2024-01-17', 'Fazenda Esperança',
    'João Silva', 'COORD-SUL',
    '2024-02-10', 'Análise Completa', 8, 'Laboratório A', '2024-01-22',
    'NEO-2024-003', '2024-01-20', 'Lab Neogen', '2024-01-24', 4, '2024-01-27'
  ),
  (
    '004', 'OS-2024-004', '2024-01-18', 'Sítio Boa Vista',
    'Pedro Costa', 'COORD-NORTE',
    '2024-02-25', 'Análise de Solo Premium', 6, 'Laboratório C', '2024-01-23',
    NULL, NULL, NULL, NULL, NULL, NULL
  ),
  (
    '005', 'OS-2024-005', '2024-01-19', 'Fazenda Santa Rita',
    'Maria Santos', 'COORD-NORTE',
    '2024-02-05', 'Análise Rápida', 2, 'Laboratório B', '2024-01-24',
    'NEO-2024-005', '2024-01-21', 'Lab Neogen', '2024-01-25', 1, '2024-01-28'
  ),
  (
    '006', 'OS-2024-006', '2024-01-20', 'Agro Felicidade',
    'João Silva', 'COORD-SUL',
    '2024-03-01', 'Análise de Solo Básica', 4, 'Laboratório A', '2024-01-25',
    'NEO-2024-006', '2024-01-22', 'Lab Neogen', '2024-01-26', 2, '2024-01-29'
  ),
  (
    '007', 'OS-2024-007', '2024-01-21', 'Fazenda Progresso',
    'Ana Lima', 'COORD-LESTE',
    '2024-02-28', 'Análise Completa', 10, 'Laboratório D', '2024-01-26',
    'NEO-2024-007', '2024-01-23', 'Lab Neogen', '2024-01-27', 5, '2024-01-30'
  ),
  (
    '008', 'OS-2024-008', '2024-01-22', 'Sítio Primavera',
    'Pedro Costa', 'COORD-NORTE',
    '2024-02-18', 'Análise de Solo Premium', 7, 'Laboratório C', '2024-01-27',
    NULL, NULL, NULL, NULL, NULL, NULL
  ),
  (
    '009', 'OS-2024-009', '2024-01-23', 'Fazenda Vitória',
    'Ana Lima', 'COORD-LESTE',
    '2024-02-12', 'Análise de Solo Básica', 3, 'Laboratório D', '2024-01-28',
    'NEO-2024-009', '2024-01-24', 'Lab Neogen', '2024-01-28', 2, '2024-01-31'
  ),
  (
    '010', 'OS-2024-010', '2024-01-24', 'Agropecuária União',
    'Maria Santos', 'COORD-NORTE',
    '2024-03-05', 'Análise Completa', 9, 'Laboratório B', '2024-01-29',
    'NEO-2024-010', '2024-01-25', 'Lab Neogen', '2024-01-29', 4, '2024-02-01'
  );