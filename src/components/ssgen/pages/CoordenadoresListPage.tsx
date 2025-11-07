import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderBar } from '../shared/HeaderBar';
import { fetchCoordenadores, deleteCoordenador } from '@/lib/coordenadoresApi';
import { Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CoordenadoresListPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  const { data: coordenadores = [], refetch } = useQuery({
    queryKey: ['coordenadores'],
    queryFn: fetchCoordenadores,
  });

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir ${nome}?`)) {
      try {
        await deleteCoordenador(id);
        toast({ title: 'Coordenador excluído com sucesso!' });
        refetch();
      } catch (error: any) {
        toast({ 
          title: 'Erro ao excluir coordenador', 
          description: error.message,
          variant: 'destructive' 
        });
      }
    }
  };

  const filtered = coordenadores.filter((c) =>
    c.nome.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Coordenadores" query={query} setQuery={setQuery} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((coord) => (
          <Card key={coord.id} className="hover:shadow-lg transition-all hover:border-primary/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">{coord.nome}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(coord.id, coord.nome)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {coord.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  {coord.email}
                </div>
              )}
              {coord.ativo && (
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success border border-success/20">
                    Ativo
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Nenhum coordenador encontrado
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordenadoresListPage;
