-- Ajustar FELIPE SANTANA COELHO (2371fcc9) de 386 para 388
-- Primeiro usar valor temporário
UPDATE service_orders SET ordem_servico_ssgen = -386 WHERE id = '2371fcc9-cd6a-4ebd-91ba-717cbcd85fb8';
UPDATE service_orders SET ordem_servico_ssgen = 388 WHERE id = '2371fcc9-cd6a-4ebd-91ba-717cbcd85fb8';

-- Ajustar FELIPE SANTANA COELHO (a59c5d7c) de 385 para 386
UPDATE service_orders SET ordem_servico_ssgen = -385 WHERE id = 'a59c5d7c-cc7c-4116-9518-71aa2b6b24e8';
UPDATE service_orders SET ordem_servico_ssgen = 386 WHERE id = 'a59c5d7c-cc7c-4116-9518-71aa2b6b24e8';

-- Ajustar RAFAEL para 385
UPDATE service_orders SET ordem_servico_ssgen = 385 WHERE id = '8b82d84b-46c1-4463-9bef-5ab057a11277';