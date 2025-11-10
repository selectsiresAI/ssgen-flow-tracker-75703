import { Role } from "@/types/order";

export type FeatureFlags = {
  filters: { coord: boolean; rep: boolean; cliente: boolean; periodo: boolean; produto: boolean; status: boolean };
  kpis: { showAll: boolean };
  kanban: { editable: boolean };
  table: { edit: boolean; attach: boolean; financeMark: boolean; export: boolean; comments: boolean };
  panels: { financeiro: 'full' | 'readonly' | 'hidden' };
  files: { upload: boolean; download: boolean };
  notes: { read: boolean; write: boolean };
  settings: { sla: boolean; users: boolean; import: boolean };
};

export const FEATURES: Record<Role, FeatureFlags> = {
  ADM: {
    filters: { coord: true, rep: true, cliente: true, periodo: true, produto: true, status: true },
    kpis: { showAll: true },
    kanban: { editable: true },
    table: { edit: true, attach: true, financeMark: true, export: true, comments: true },
    panels: { financeiro: 'full' },
    files: { upload: true, download: true },
    notes: { read: true, write: true },
    settings: { sla: true, users: true, import: true },
  },
  COORDENADOR: {
    filters: { coord: false, rep: true, cliente: true, periodo: true, produto: true, status: true },
    kpis: { showAll: true },
    kanban: { editable: false },
    table: { edit: false, attach: false, financeMark: false, export: true, comments: true },
    panels: { financeiro: 'readonly' },
    files: { upload: false, download: true },
    notes: { read: true, write: true },
    settings: { sla: false, users: false, import: false },
  },
  REPRESENTANTE: {
    filters: { coord: false, rep: false, cliente: true, periodo: true, produto: false, status: true },
    kpis: { showAll: false },
    kanban: { editable: false },
    table: { edit: false, attach: false, financeMark: false, export: true, comments: false },
    panels: { financeiro: 'hidden' },
    files: { upload: false, download: true },
    notes: { read: false, write: false },
    settings: { sla: false, users: false, import: false },
  },
};
