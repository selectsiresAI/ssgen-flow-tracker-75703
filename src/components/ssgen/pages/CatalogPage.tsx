import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderBar } from '../shared/HeaderBar';

interface CatalogPageProps {
  title: string;
  items: string[];
}

const CatalogPage: React.FC<CatalogPageProps> = ({ title, items }) => (
  <div className="space-y-4">
    <HeaderBar title={title} query={''} setQuery={() => {}} />
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((k) => (
            <div key={k} className="border rounded-xl p-3">
              <div className="text-sm font-semibold">{k}</div>
              <div className="text-xs text-muted-foreground">(detalhes, e-mail, telefone…)</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default CatalogPage;
