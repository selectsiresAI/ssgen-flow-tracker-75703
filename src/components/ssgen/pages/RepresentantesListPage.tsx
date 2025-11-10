import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderBar } from '../shared/HeaderBar';
import { fetchRepresentantes, deleteRepresentante } from '@/lib/representantesApi';
import { Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types/ssgen';

interface RepresentantesListPageProps {
  profile: Profile | null;
}

const RepresentantesListPage: React.FC<RepresentantesListPageProps> = ({ profile }) => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  const { data: representantes = [], refetch } = useQuery({
    queryKey: ['representantes', profile?.role, profile?.coord, profile?.rep],
    queryFn: async () => {
      if (profile?.role === 'COORDENADOR') {
        if (!profile.coord) {
          return [];
        }
        return fetchRepresentantes({ coord: profile.coord });
      }
      if (profile?.role === 'REPRESENTANTE') {
        if (!profile.rep) {
          return [];
        }
        return fetchRepresentantes({ rep: profile.rep });
      }
      return fetchRepresentantes();
    },
  });

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir ${nome}?`)) {
      try {
        await deleteRepresentante(id);
        toast({ title: 'Representante excluído com sucesso!' });
        refetch();
      } catch (error: any) {
        toast({ 
          title: 'Erro ao excluir representante', 
          description: error.message,
          variant: 'destructive' 
        });
      }
    }
  };

  const filtered = useMemo(
    () =>
      representantes.filter((r) =>
        r.nome.toLowerCase().includes(query.toLowerCase())
      ),
    [representantes, query]
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Representantes" query={query} setQuery={setQuery} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((rep) => (
          <Card key={rep.id} className="hover:shadow-lg transition-all hover:border-primary/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">{rep.nome}</CardTitle>
              {profile?.role === 'ADM' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(rep.id, rep.nome)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {rep.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  {rep.email}
                </div>
              )}
              {rep.coordenador_nome && (
                <div className="text-sm text-muted-foreground">Coordenador: {rep.coordenador_nome}</div>
              )}
              {rep.ativo && (
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
            Nenhum representante encontrado
          </div>
        )}
      </div>
    </div>
  );
};

export default RepresentantesListPage;
