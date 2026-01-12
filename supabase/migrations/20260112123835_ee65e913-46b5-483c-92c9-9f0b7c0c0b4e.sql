-- Corrigir OS SSGEN conforme imagem de referência
-- Cada registro deve ter seu ordem_servico_ssgen reduzido em 1
-- Fazendo em ordem decrescente para evitar conflitos de unicidade

-- Primeiro, vamos usar valores temporários negativos para evitar conflitos
UPDATE service_orders SET ordem_servico_ssgen = -398 WHERE id = '55d520b9-3971-4419-86b8-f880ff1b9bdd';
UPDATE service_orders SET ordem_servico_ssgen = -397 WHERE id = 'c5360ef8-000b-4e0b-949b-1cdf1b35917e';
UPDATE service_orders SET ordem_servico_ssgen = -396 WHERE id = '84b89561-b20b-462b-a935-3444ab57be08';
UPDATE service_orders SET ordem_servico_ssgen = -395 WHERE id = '8816c5db-bd90-4fe2-8c16-c1a177a870f6';
UPDATE service_orders SET ordem_servico_ssgen = -394 WHERE id = 'c2e55afb-595e-4494-b378-750b60f3adf8';
UPDATE service_orders SET ordem_servico_ssgen = -393 WHERE id = 'a74335c7-1b8e-433a-92d7-686a0db2aad2';
UPDATE service_orders SET ordem_servico_ssgen = -392 WHERE id = '76348d83-7220-426d-b78b-87ca60a83353';
UPDATE service_orders SET ordem_servico_ssgen = -391 WHERE id = '0adb49b9-711a-4c3a-b685-b6182fff0980';
UPDATE service_orders SET ordem_servico_ssgen = -390 WHERE id = '9a4bfe1c-9dbb-47fe-92a8-2d7a798707ef';
UPDATE service_orders SET ordem_servico_ssgen = -389 WHERE id = 'd3f95d91-aff4-4db2-a8fd-648b6fe42a4a';
UPDATE service_orders SET ordem_servico_ssgen = -388 WHERE id = '2371fcc9-cd6a-4ebd-91ba-717cbcd85fb8';
UPDATE service_orders SET ordem_servico_ssgen = -387 WHERE id = 'a59c5d7c-cc7c-4116-9518-71aa2b6b24e8';
UPDATE service_orders SET ordem_servico_ssgen = -386 WHERE id = '8b82d84b-46c1-4463-9bef-5ab057a11277';

-- Agora atribuir os valores corretos
UPDATE service_orders SET ordem_servico_ssgen = 397 WHERE id = '55d520b9-3971-4419-86b8-f880ff1b9bdd'; -- Era 398, agora 397
UPDATE service_orders SET ordem_servico_ssgen = 396 WHERE id = 'c5360ef8-000b-4e0b-949b-1cdf1b35917e'; -- Era 397, agora 396
UPDATE service_orders SET ordem_servico_ssgen = 395 WHERE id = '84b89561-b20b-462b-a935-3444ab57be08'; -- Era 396, agora 395
UPDATE service_orders SET ordem_servico_ssgen = 394 WHERE id = '8816c5db-bd90-4fe2-8c16-c1a177a870f6'; -- Era 395, agora 394
UPDATE service_orders SET ordem_servico_ssgen = 393 WHERE id = 'c2e55afb-595e-4494-b378-750b60f3adf8'; -- Era 394, agora 393
UPDATE service_orders SET ordem_servico_ssgen = 392 WHERE id = 'a74335c7-1b8e-433a-92d7-686a0db2aad2'; -- Era 393, agora 392
UPDATE service_orders SET ordem_servico_ssgen = 391 WHERE id = '76348d83-7220-426d-b78b-87ca60a83353'; -- Era 392, agora 391
UPDATE service_orders SET ordem_servico_ssgen = 390 WHERE id = '0adb49b9-711a-4c3a-b685-b6182fff0980'; -- Era 391, agora 390
UPDATE service_orders SET ordem_servico_ssgen = 389 WHERE id = '9a4bfe1c-9dbb-47fe-92a8-2d7a798707ef'; -- Era 390, agora 389
UPDATE service_orders SET ordem_servico_ssgen = 388 WHERE id = 'd3f95d91-aff4-4db2-a8fd-648b6fe42a4a'; -- Era 389, agora 388
UPDATE service_orders SET ordem_servico_ssgen = 387 WHERE id = '2371fcc9-cd6a-4ebd-91ba-717cbcd85fb8'; -- Era 388, agora 387
UPDATE service_orders SET ordem_servico_ssgen = 386 WHERE id = 'a59c5d7c-cc7c-4116-9518-71aa2b6b24e8'; -- Era 387, agora 386
UPDATE service_orders SET ordem_servico_ssgen = 385 WHERE id = '8b82d84b-46c1-4463-9bef-5ab057a11277'; -- Era 386, agora 385