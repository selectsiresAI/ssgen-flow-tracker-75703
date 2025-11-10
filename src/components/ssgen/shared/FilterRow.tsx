import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet } from 'lucide-react';

interface FilterRowProps {
  showCoord: boolean;
  showRep: boolean;
  showCliente: boolean;
  showProduto: boolean;
  showPeriodo: boolean;
  showStatus: boolean;
  coords: string[];
  reps: string[];
  clientes: string[];
  produtos: string[];
  coord?: string;
  setCoord: (v: string | undefined) => void;
  rep?: string;
  setRep: (v: string | undefined) => void;
  cliente?: string;
  setCliente: (v: string | undefined) => void;
  produto?: string;
  setProduto: (v: string | undefined) => void;
  onClear: () => void;
}

export const FilterRow: React.FC<FilterRowProps> = (p) => (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
    {p.showCoord && (
      <Select value={p.coord ?? undefined} onValueChange={(v) => p.setCoord(v || undefined)}>
        <SelectTrigger>
          <SelectValue placeholder="COORD (Coordenador)" />
        </SelectTrigger>
        <SelectContent>
          {p.coords
            .filter((c) => c && c.trim() !== '')
            .map((c) => (
              <SelectItem key={c} value={String(c)}>
                {c}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    )}
    {p.showRep && (
      <Select value={p.rep ?? undefined} onValueChange={(v) => p.setRep(v || undefined)}>
        <SelectTrigger>
          <SelectValue placeholder="REP (Representante)" />
        </SelectTrigger>
        <SelectContent>
          {p.reps
            .filter((c) => c && c.trim() !== '')
            .map((c) => (
              <SelectItem key={c} value={String(c)}>
                {c}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    )}
    {p.showCliente && (
      <Select value={p.cliente ?? undefined} onValueChange={(v) => p.setCliente(v || undefined)}>
        <SelectTrigger>
          <SelectValue placeholder="CLIENTE" />
        </SelectTrigger>
        <SelectContent>
          {p.clientes
            .filter((c) => c && c.trim() !== '')
            .map((c) => (
              <SelectItem key={c} value={String(c)}>
                {c}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    )}
    {p.showProduto && (
      <Select value={p.produto ?? undefined} onValueChange={(v) => p.setProduto(v || undefined)}>
        <SelectTrigger>
          <SelectValue placeholder="Produto (PROD_SSG/PROD_NEOGEN)" />
        </SelectTrigger>
        <SelectContent>
          {p.produtos
            .filter((c) => c && c.trim() !== '')
            .map((c) => (
              <SelectItem key={c} value={String(c)}>
                {c}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    )}
    {p.showPeriodo && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-2 border rounded-lg">
        Período: use DT_SSGEN_OS (implementar datepicker)
      </div>
    )}
    {p.showStatus && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-2 border rounded-lg">
        Status: derivado por datas (ver regras)
      </div>
    )}
    <div className="flex items-center gap-2">
      <Button variant="ghost" className="ml-auto" onClick={p.onClear}>
        Limpar
      </Button>
      <Button variant="outline" className="gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        Exportar
      </Button>
    </div>
  </div>
);
