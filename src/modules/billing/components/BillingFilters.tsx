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
    <div className="bg-zenith-card rounded-2xl p-4 border border-zenith-navy/30">
      <div className="text-zenith-gold mb-3 font-semibold">Filtros</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white text-sm">Representante</Label>
          <Select value={selectedRep} onValueChange={onRepChange}>
            <SelectTrigger className="bg-zenith-bg text-white border-zenith-navy">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-zenith-card border-zenith-navy">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {representantes
                .filter((rep) => rep && rep.trim() !== '')
                .map((rep) => (
                  <SelectItem key={rep} value={String(rep)} className="text-white">
                    {rep}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-white text-sm">Coordenador</Label>
          <Select value={selectedCoord} onValueChange={onCoordChange}>
            <SelectTrigger className="bg-zenith-bg text-white border-zenith-navy">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-zenith-card border-zenith-navy">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {coordenadores
                .filter((coord) => coord && coord.trim() !== '')
                .map((coord) => (
                  <SelectItem key={coord} value={String(coord)} className="text-white">
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
