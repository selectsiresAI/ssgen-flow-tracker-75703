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
import selectSiresLogo from '@/assets/select-sires-logo.png';

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
    { key: 'coordenadores', label: 'Coordenadores', icon: <UserSquare2 className="w-4 h-4" /> },
    { key: 'representantes', label: 'Representantes', icon: <Users2 className="w-4 h-4" /> },
    { key: 'faturamento', label: 'Faturamento', icon: <Receipt className="w-4 h-4" /> },
    { key: 'config', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  const allow = (k: string) => {
    if (role === 'REPRESENTANTE' && (k === 'coordenadores' || k === 'config')) return false;
    if (role === 'GERENTE' && (k === 'coordenadores' || k === 'config')) return false;
    return true;
  };

  return (
    <aside className="w-full md:w-72 border-r bg-sidebar">
      <div className="p-6 py-8">
        <div className="flex items-center justify-center">
          <img src={selectSiresLogo} alt="Select Sires Logo" className="h-24 w-auto" />
        </div>
      </div>
      <Separator />
      <nav className="p-3 space-y-1">
        {items.filter((i) => allow(i.key)).map((i) => (
          <button
            key={i.key}
            onClick={() => setCurrent(i.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              current === i.key 
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            }`}
          >
            {i.icon}
            <span>{i.label}</span>
          </button>
        ))}
      </nav>
      <Separator className="my-3" />
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full gap-3 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
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
