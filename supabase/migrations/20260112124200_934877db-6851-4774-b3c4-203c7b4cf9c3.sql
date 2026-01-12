-- Corrigir sequência 388-385 para 387-384
-- Primeiro valores temporários negativos para evitar conflitos

UPDATE service_orders SET ordem_servico_ssgen = -388 WHERE id = 'd3f95d91-aff4-4db2-a8fd-648b6fe42a4a'; -- WILLIAN SIQUEIRA DE LIMA
UPDATE service_orders SET ordem_servico_ssgen = -387 WHERE id = '2371fcc9-cd6a-4ebd-91ba-717cbcd85fb8'; -- FELIPE SANTANA COELHO
UPDATE service_orders SET ordem_servico_ssgen = -386 WHERE id = 'a59c5d7c-cc7c-4116-9518-71aa2b6b24e8'; -- FELIPE SANTANA COELHO
UPDATE service_orders SET ordem_servico_ssgen = -385 WHERE id = '8b82d84b-46c1-4463-9bef-5ab057a11277'; -- RAFAEL FERNANDO MOTA LIMA

-- Agora atribuir os valores corretos
UPDATE service_orders SET ordem_servico_ssgen = 387 WHERE id = 'd3f95d91-aff4-4db2-a8fd-648b6fe42a4a'; -- WILLIAN -> 387
UPDATE service_orders SET ordem_servico_ssgen = 386 WHERE id = '2371fcc9-cd6a-4ebd-91ba-717cbcd85fb8'; -- FELIPE -> 386
UPDATE service_orders SET ordem_servico_ssgen = 385 WHERE id = 'a59c5d7c-cc7c-4116-9518-71aa2b6b24e8'; -- FELIPE -> 385
UPDATE service_orders SET ordem_servico_ssgen = 384 WHERE id = '8b82d84b-46c1-4463-9bef-5ab057a11277'; -- RAFAEL -> 384