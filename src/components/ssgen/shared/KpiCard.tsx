import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KpiProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const Kpi: React.FC<KpiProps> = ({ title, value, subtitle, icon }) => (
  <Card className="rounded-xl shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon && <div className="text-muted-foreground">{icon}</div>}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);
