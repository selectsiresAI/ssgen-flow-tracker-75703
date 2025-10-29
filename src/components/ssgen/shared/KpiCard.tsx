import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KpiProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const Kpi: React.FC<KpiProps> = ({ title, value, subtitle, icon }) => (
  <Card className="rounded-lg shadow-md border-l-4 border-l-primary hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
      {icon && <div className="text-primary">{icon}</div>}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
    </CardContent>
  </Card>
);
