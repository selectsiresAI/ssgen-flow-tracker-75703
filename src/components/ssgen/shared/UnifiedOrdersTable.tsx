import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { UnifiedOrder } from '@/types/ssgen';
import { fmt } from '@/types/ssgen';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UnifiedOrdersTableProps {
  rows: UnifiedOrder[];
  onOpen: (r: UnifiedOrder) => void;
}

export const UnifiedOrdersTable: React.FC<UnifiedOrdersTableProps> = ({ rows, onOpen }) => {
  return (
    <ScrollArea className="w-full">
      <div className="min-w-[1800px]">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left border">Ordem de Serviço SSGen</th>
              <th className="p-2 text-left border">Data</th>
              <th className="p-2 text-left border">Ordem de Serviço Neogen</th>
              <th className="p-2 text-left border">Nome</th>
              <th className="p-2 text-left border">CPF/CNPJ</th>
              <th className="p-2 text-left border">IE/RG</th>
              <th className="p-2 text-left border">Código</th>
              <th className="p-2 text-left border">Status</th>
              <th className="p-2 text-left border">Representante</th>
              <th className="p-2 text-left border">Coordenador</th>
              <th className="p-2 text-left border">ID Conta SSGen</th>
              <th className="p-2 text-left border">Nº NF Neogen</th>
              <th className="p-2 text-left border">Nº Teste Nota</th>
              <th className="p-2 text-left border">Nome Produto</th>
              <th className="p-2 text-left border">Número de Amostras</th>
              <th className="p-2 text-left border">CRA Data</th>
              <th className="p-2 text-left border">CRA Status</th>
              <th className="p-2 text-left border">Envio Planilha Data</th>
              <th className="p-2 text-left border">Envio Planilha Status</th>
              <th className="p-2 text-left border">VRI Data</th>
              <th className="p-2 text-left border">VRI Nº Amostras</th>
              <th className="p-2 text-left border">LPR Data</th>
              <th className="p-2 text-left border">LPR Nº Amostras</th>
              <th className="p-2 text-left border">Liberação Data</th>
              <th className="p-2 text-left border">Liberação Nº Amostras</th>
              <th className="p-2 text-left border">Envio Resultados Data</th>
              <th className="p-2 text-left border">Envio Resultados Status</th>
              <th className="p-2 text-left border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={27} className="p-4 text-center text-muted-foreground">
                  Nenhuma ordem encontrada
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  <td className="p-2 border">
                    <button
                      onClick={() => onOpen(row)}
                      className="text-primary hover:underline font-medium"
                    >
                      {row.ordem_servico_ssgen}
                    </button>
                  </td>
                  <td className="p-2 border">{fmt(row.data_cadastro)}</td>
                  <td className="p-2 border">{row.ordem_servico_neogen || '—'}</td>
                  <td className="p-2 border">{row.cliente_nome || '—'}</td>
                  <td className="p-2 border">{row.cpf_cnpj || '—'}</td>
                  <td className="p-2 border">{row.ie_rg || '—'}</td>
                  <td className="p-2 border">{row.codigo || '—'}</td>
                  <td className="p-2 border">
                    {row.cliente_status ? (
                      <Badge variant="outline">{row.cliente_status}</Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 border">{row.representante || '—'}</td>
                  <td className="p-2 border">{row.coordenador || '—'}</td>
                  <td className="p-2 border">{row.id_conta_ssgen || '—'}</td>
                  <td className="p-2 border">{row.numero_nf_neogen || '—'}</td>
                  <td className="p-2 border">{row.numero_teste_nota_neogen || '—'}</td>
                  <td className="p-2 border">{row.nome_produto || '—'}</td>
                  <td className="p-2 border">{row.numero_amostras || '—'}</td>
                  <td className="p-2 border">{fmt(row.cra_data)}</td>
                  <td className="p-2 border">
                    {row.cra_status ? (
                      <Badge variant="secondary">{row.cra_status}</Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 border">{fmt(row.envio_planilha_data)}</td>
                  <td className="p-2 border">
                    {row.envio_planilha_status ? (
                      <Badge variant="secondary">{row.envio_planilha_status}</Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 border">{fmt(row.vri_data)}</td>
                  <td className="p-2 border">{row.vri_n_amostras || '—'}</td>
                  <td className="p-2 border">{fmt(row.lpr_data)}</td>
                  <td className="p-2 border">{row.lpr_n_amostras || '—'}</td>
                  <td className="p-2 border">{fmt(row.liberacao_data)}</td>
                  <td className="p-2 border">{row.liberacao_n_amostras || '—'}</td>
                  <td className="p-2 border">{fmt(row.envio_resultados_data)}</td>
                  <td className="p-2 border">
                    {row.envio_resultados_status ? (
                      <Badge variant="secondary">{row.envio_resultados_status}</Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2 border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpen(row)}
                    >
                      Detalhes
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
};
