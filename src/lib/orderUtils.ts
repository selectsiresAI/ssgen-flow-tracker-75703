import { OrderRow } from "@/types/order";

export const isSet = (v: any) => v !== null && v !== undefined && v !== "";

export const daysBetween = (a?: string | null, b?: string | null) => {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
};

export const fmt = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : "—");

export const slaBadge = (row: OrderRow) => {
  const target = row.dt_prev_result_ssg;
  if (!target) return { label: "—", tone: "secondary" as const };
  const d = daysBetween(target, new Date().toISOString().slice(0, 10));
  if (d === null) return { label: "—", tone: "secondary" as const };
  if (d < 0) return { label: `${d}d`, tone: "success" as const };
  if (d === 0) return { label: "D0", tone: "warning" as const };
  return { label: `+${d}d`, tone: "destructive" as const };
};
