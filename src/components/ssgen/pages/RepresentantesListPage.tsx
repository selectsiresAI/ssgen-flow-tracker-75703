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
          <Card key={rep.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{rep.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              {rep.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {rep.email}
                </div>
              )}
              {rep.ativo && (
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
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
