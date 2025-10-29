import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import type { PowerRow } from '@/types/ssgen';
import { HeaderBar } from '../shared/HeaderBar';
import { TableOrdens } from '../shared/OrdersTable';

interface OrdersPageProps {
  rows: PowerRow[];
  onOpen: (r: PowerRow) => void;
  canEdit: boolean;
  canAttach: boolean;
  canFinance: boolean;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ rows, onOpen, canEdit, canAttach, canFinance }) => (
  <div className="space-y-4">
    <HeaderBar title="Ordens" query={''} setQuery={() => {}}>
      <Button variant="outline" className="gap-2">
        <Upload className="w-4 h-4" />
        Importar Excel
      </Button>
    </HeaderBar>
    <TableOrdens rows={rows} allowEdit={canEdit} allowAttach={canAttach} allowFinance={canFinance} onOpen={onOpen} />
  </div>
);

export default OrdersPage;
