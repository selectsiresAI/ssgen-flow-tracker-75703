import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  ListTodo,
  Building2,
  Users2,
  UserSquare2,
  Receipt,
  Settings,
  LogOut,
} from 'lucide-react';
import type { Role } from '@/types/ssgen';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  current: string;
  setCurrent: (k: string) => void;
  role: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({ current, setCurrent, role }) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'clientes', label: 'Clientes', icon: <Building2 className="w-4 h-4" /> },
    { key: 'nova-ordem', label: 'Nova Ordem', icon: <ListTodo className="w-4 h-4" /> },
    { key: 'ordens', label: 'Ordens', icon: <ListTodo className="w-4 h-4" /> },
    { key: 'representantes', label: 'Representantes', icon: <Users2 className="w-4 h-4" /> },
    { key: 'gerentes', label: 'Gerentes', icon: <UserSquare2 className="w-4 h-4" /> },
    { key: 'faturamento', label: 'Faturamento', icon: <Receipt className="w-4 h-4" /> },
    { key: 'config', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  const allow = (k: string) => {
    if (role === 'REPRESENTANTE' && (k === 'gerentes' || k === 'config')) return false;
    if (role === 'GERENTE' && k === 'config') return false;
    return true;
  };

  return (
    <aside className="w-full md:w-72 border-r bg-background">
      <div className="p-4 text-lg font-semibold">SSGEN Track</div>
      <nav className="p-2 space-y-1">
        {items.filter((i) => allow(i.key)).map((i) => (
          <button
            key={i.key}
            onClick={() => setCurrent(i.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-muted ${
              current === i.key ? 'bg-muted' : ''
            }`}
          >
            {i.icon}
            <span>{i.label}</span>
          </button>
        ))}
      </nav>
      <Separator className="my-3" />
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full gap-2"
          onClick={async () => {
            await supabase.auth.signOut();
            location.reload();
          }}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
};
