import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface BillingFiltersProps {
  representantes: string[];
  coordenadores: string[];
  selectedRep: string;
  selectedCoord: string;
  onRepChange: (value: string) => void;
  onCoordChange: (value: string) => void;
}

export function BillingFilters({
  representantes,
  coordenadores,
  selectedRep,
  selectedCoord,
  onRepChange,
  onCoordChange,
}: BillingFiltersProps) {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <div className="text-foreground mb-3 font-semibold">Filtros</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground text-sm">Representante</Label>
          <Select value={selectedRep} onValueChange={onRepChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {representantes
                .filter((rep) => rep && rep.trim() !== '')
                .map((rep) => (
                  <SelectItem key={rep} value={String(rep)}>
                    {rep}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-foreground text-sm">Coordenador</Label>
          <Select value={selectedCoord} onValueChange={onCoordChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {coordenadores
                .filter((coord) => coord && coord.trim() !== '')
                .map((coord) => (
                  <SelectItem key={coord} value={String(coord)}>
                    {coord}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
