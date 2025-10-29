import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderBar } from '../shared/HeaderBar';
import { fetchRepresentantes } from '@/lib/representantesApi';
import { Mail } from 'lucide-react';

const RepresentantesListPage: React.FC = () => {
  const [query, setQuery] = useState('');

  const { data: representantes = [] } = useQuery({
    queryKey: ['representantes'],
    queryFn: fetchRepresentantes,
  });

  const filtered = representantes.filter((r) =>
    r.nome.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Representantes" query={query} setQuery={setQuery} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((rep) => (
          <Card key={rep.id} className="hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">{rep.nome}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rep.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  {rep.email}
                </div>
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
