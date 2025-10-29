import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface HeaderBarProps {
  title: string;
  query: string;
  setQuery: (v: string) => void;
  children?: React.ReactNode;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, query, setQuery, children }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 w-[260px]"
          placeholder="Buscar por OS_SSGEN, CLIENTE, REP, COORD"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button variant="outline" className="gap-2">
        <Filter className="w-4 h-4" />
        Filtros
      </Button>
      {children}
    </div>
  </div>
);
