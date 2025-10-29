export type Role = "ADM" | "GERENTE" | "REPRESENTANTE";

export type OrderRow = {
  id?: string;
  os_ssgen: string;
  cliente: string;
  coord: string;
  rep: string;
  prod_ssg?: string | null;
  dt_ssgen_os?: string | null;
  dt_plan_ssg?: string | null;
  dt_prev_result_ssg?: string | null;
  dt_result_ssg?: string | null;
  fatur_tipo?: string | null;
  fatur_ssg?: number | null;
  dt_fatur_ssg?: string | null;
  os_neogen?: string | null;
  dt_cra?: string | null;
  plan_neogen?: string | null;
  dt_plan_neogen?: string | null;
  n_vri?: number | null;
  dt_vri?: string | null;
  n_lpr?: number | null;
  dt_lpr?: string | null;
  n_lr?: number | null;
  dt_lr?: string | null;
  lr_rastreio?: string | null;
  nf_neogem?: string | null;
};
