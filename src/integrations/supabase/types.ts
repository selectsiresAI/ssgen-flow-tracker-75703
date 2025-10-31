export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          codigo: number | null
          coordenador: string
          cpf_cnpj: number
          created_at: string
          data: string
          id_conta_ssgen: number | null
          ie_rg: number | null
          nome: string
          ordem_servico_neogen: number | null
          ordem_servico_ssgen: number
          representante: string
          status: string | null
          updated_at: string
        }
        Insert: {
          codigo?: number | null
          coordenador: string
          cpf_cnpj: number
          created_at?: string
          data: string
          id_conta_ssgen?: number | null
          ie_rg?: number | null
          nome: string
          ordem_servico_neogen?: number | null
          ordem_servico_ssgen: number
          representante: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          codigo?: number | null
          coordenador?: string
          cpf_cnpj?: number
          created_at?: string
          data?: string
          id_conta_ssgen?: number | null
          ie_rg?: number | null
          nome?: string
          ordem_servico_neogen?: number | null
          ordem_servico_ssgen?: number
          representante?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coordenadores: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cliente: string
          cod_ssb: string | null
          coord: string
          created_at: string
          dt_cra: string | null
          dt_fatur_ssg: string | null
          dt_lpr: string | null
          dt_lr: string | null
          dt_plan_neogen: string | null
          dt_plan_ssg: string | null
          dt_prev_result_ssg: string | null
          dt_result_ssg: string | null
          dt_ssgen_os: string | null
          dt_vri: string | null
          fatur_ssg: number | null
          fatur_tipo: string | null
          id: string
          lib_cad_cliente: string | null
          lr_rastreio: string | null
          n_amostras_neogen: number | null
          n_amostras_ssg: number | null
          n_lpr: number | null
          n_lr: number | null
          n_vri: number | null
          nf_na_neogen: string | null
          nf_neogem: string | null
          ord: string | null
          os_neogen: string | null
          os_ssgen: string
          plan_neogen: string | null
          plan_ssg: string | null
          prod_neogen: string | null
          prod_ssg: string | null
          rep: string
          result_ssg: string | null
          updated_at: string
        }
        Insert: {
          cliente: string
          cod_ssb?: string | null
          coord: string
          created_at?: string
          dt_cra?: string | null
          dt_fatur_ssg?: string | null
          dt_lpr?: string | null
          dt_lr?: string | null
          dt_plan_neogen?: string | null
          dt_plan_ssg?: string | null
          dt_prev_result_ssg?: string | null
          dt_result_ssg?: string | null
          dt_ssgen_os?: string | null
          dt_vri?: string | null
          fatur_ssg?: number | null
          fatur_tipo?: string | null
          id?: string
          lib_cad_cliente?: string | null
          lr_rastreio?: string | null
          n_amostras_neogen?: number | null
          n_amostras_ssg?: number | null
          n_lpr?: number | null
          n_lr?: number | null
          n_vri?: number | null
          nf_na_neogen?: string | null
          nf_neogem?: string | null
          ord?: string | null
          os_neogen?: string | null
          os_ssgen: string
          plan_neogen?: string | null
          plan_ssg?: string | null
          prod_neogen?: string | null
          prod_ssg?: string | null
          rep: string
          result_ssg?: string | null
          updated_at?: string
        }
        Update: {
          cliente?: string
          cod_ssb?: string | null
          coord?: string
          created_at?: string
          dt_cra?: string | null
          dt_fatur_ssg?: string | null
          dt_lpr?: string | null
          dt_lr?: string | null
          dt_plan_neogen?: string | null
          dt_plan_ssg?: string | null
          dt_prev_result_ssg?: string | null
          dt_result_ssg?: string | null
          dt_ssgen_os?: string | null
          dt_vri?: string | null
          fatur_ssg?: number | null
          fatur_tipo?: string | null
          id?: string
          lib_cad_cliente?: string | null
          lr_rastreio?: string | null
          n_amostras_neogen?: number | null
          n_amostras_ssg?: number | null
          n_lpr?: number | null
          n_lr?: number | null
          n_vri?: number | null
          nf_na_neogen?: string | null
          nf_neogem?: string | null
          ord?: string | null
          os_neogen?: string | null
          os_ssgen?: string
          plan_neogen?: string | null
          plan_ssg?: string | null
          prod_neogen?: string | null
          prod_ssg?: string | null
          rep?: string
          result_ssg?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      representantes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          cliente_lat: number | null
          cliente_lon: number | null
          cra_data: string | null
          cra_status: string | null
          created_at: string
          dt_faturamento: string | null
          dt_receb_resultados: string | null
          envio_planilha_data: string | null
          envio_planilha_status: string | null
          envio_planilha_status_sla: string | null
          envio_resultados_data: string | null
          envio_resultados_data_prova: string | null
          envio_resultados_ordem_id: number | null
          envio_resultados_previsao: string | null
          envio_resultados_status: string | null
          envio_resultados_status_sla: string | null
          flag_reagendamento: boolean | null
          id: string
          issue_text: string | null
          lpr_data: string | null
          lpr_n_amostras: number | null
          lpr_status_sla: string | null
          nome_produto: string | null
          numero_amostras: number | null
          numero_nf_neogen: number | null
          ordem_servico_neogen: number | null
          ordem_servico_ssgen: number
          prioridade: string | null
          updated_at: string
          vri_data: string | null
          vri_n_amostras: number | null
          vri_resolvido_data: string | null
          vri_status_sla: string | null
        }
        Insert: {
          cliente_lat?: number | null
          cliente_lon?: number | null
          cra_data?: string | null
          cra_status?: string | null
          created_at?: string
          dt_faturamento?: string | null
          dt_receb_resultados?: string | null
          envio_planilha_data?: string | null
          envio_planilha_status?: string | null
          envio_planilha_status_sla?: string | null
          envio_resultados_data?: string | null
          envio_resultados_data_prova?: string | null
          envio_resultados_ordem_id?: number | null
          envio_resultados_previsao?: string | null
          envio_resultados_status?: string | null
          envio_resultados_status_sla?: string | null
          flag_reagendamento?: boolean | null
          id?: string
          issue_text?: string | null
          lpr_data?: string | null
          lpr_n_amostras?: number | null
          lpr_status_sla?: string | null
          nome_produto?: string | null
          numero_amostras?: number | null
          numero_nf_neogen?: number | null
          ordem_servico_neogen?: number | null
          ordem_servico_ssgen: number
          prioridade?: string | null
          updated_at?: string
          vri_data?: string | null
          vri_n_amostras?: number | null
          vri_resolvido_data?: string | null
          vri_status_sla?: string | null
        }
        Update: {
          cliente_lat?: number | null
          cliente_lon?: number | null
          cra_data?: string | null
          cra_status?: string | null
          created_at?: string
          dt_faturamento?: string | null
          dt_receb_resultados?: string | null
          envio_planilha_data?: string | null
          envio_planilha_status?: string | null
          envio_planilha_status_sla?: string | null
          envio_resultados_data?: string | null
          envio_resultados_data_prova?: string | null
          envio_resultados_ordem_id?: number | null
          envio_resultados_previsao?: string | null
          envio_resultados_status?: string | null
          envio_resultados_status_sla?: string | null
          flag_reagendamento?: boolean | null
          id?: string
          issue_text?: string | null
          lpr_data?: string | null
          lpr_n_amostras?: number | null
          lpr_status_sla?: string | null
          nome_produto?: string | null
          numero_amostras?: number | null
          numero_nf_neogen?: number | null
          ordem_servico_neogen?: number | null
          ordem_servico_ssgen?: number
          prioridade?: string | null
          updated_at?: string
          vri_data?: string | null
          vri_n_amostras?: number | null
          vri_resolvido_data?: string | null
          vri_status_sla?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["ordem_servico_ssgen"]
          },
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "vw_orders_unified"
            referencedColumns: ["ordem_servico_ssgen"]
          },
        ]
      }
      sla_config: {
        Row: {
          ativo: boolean
          cor_dentro_prazo: string
          cor_dia_zero: string
          cor_fora_prazo: string
          created_at: string
          dias_alvo: number
          etapa: string
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor_dentro_prazo?: string
          cor_dia_zero?: string
          cor_fora_prazo?: string
          created_at?: string
          dias_alvo?: number
          etapa: string
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor_dentro_prazo?: string
          cor_dia_zero?: string
          cor_fora_prazo?: string
          created_at?: string
          dias_alvo?: number
          etapa?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_locations: {
        Row: {
          created_at: string | null
          id: string
          lat: number
          lon: number
          nome: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lat: number
          lon: number
          nome: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lat?: number
          lon?: number
          nome?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          coord: string | null
          created_at: string
          id: string
          rep: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          coord?: string | null
          created_at?: string
          id?: string
          rep?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          coord?: string | null
          created_at?: string
          id?: string
          rep?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_billing_by_coord: {
        Row: {
          coordenador: string | null
          total_amostras: number | null
          total_ordens: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      v_billing_by_rep: {
        Row: {
          representante: string | null
          total_amostras: number | null
          total_ordens: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      v_billing_monthly: {
        Row: {
          mes: string | null
          mes_label: string | null
          total_amostras: number | null
          total_ordens: number | null
          valor_faturado: number | null
        }
        Relationships: []
      }
      v_billing_summary: {
        Row: {
          faturamento_mes_atual: number | null
          ordens_mes_atual: number | null
          ticket_medio: number | null
          total_amostras_faturadas: number | null
          total_coordenadores: number | null
          total_ordens_faturadas: number | null
          total_representantes: number | null
          valor_total_faturado: number | null
        }
        Relationships: []
      }
      v_map_orders: {
        Row: {
          cliente: string | null
          coordenador: string | null
          created_at: string | null
          envio_planilha_status_sla: string | null
          envio_resultados_status_sla: string | null
          flag_reagendamento: boolean | null
          id: string | null
          issue_text: string | null
          lat: number | null
          lon: number | null
          lpr_status_sla: string | null
          ordem_servico_ssgen: number | null
          prioridade: string | null
          representante: string | null
          updated_at: string | null
          vri_status_sla: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["ordem_servico_ssgen"]
          },
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "vw_orders_unified"
            referencedColumns: ["ordem_servico_ssgen"]
          },
        ]
      }
      v_ready_to_invoice: {
        Row: {
          cliente: string | null
          coordenador: string | null
          cpf_cnpj: number | null
          created_at: string | null
          dias_desde_liberacao: number | null
          envio_resultados_data: string | null
          id: string | null
          nome_produto: string | null
          numero_amostras: number | null
          ordem_servico_neogen: number | null
          ordem_servico_ssgen: number | null
          representante: string | null
          updated_at: string | null
          valor_estimado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["ordem_servico_ssgen"]
          },
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "vw_orders_unified"
            referencedColumns: ["ordem_servico_ssgen"]
          },
        ]
      }
      v_tracker_kpi_topline: {
        Row: {
          a_faturar: number | null
          alta_prioridade: number | null
          concluidas_hoje: number | null
          em_processamento: number | null
          pct_sla_envio_ok: number | null
          pct_sla_envio_res_ok: number | null
          pct_sla_lpr_ok: number | null
          pct_sla_vri_ok: number | null
          reagendamentos: number | null
          sla_envio_atrasado: number | null
          sla_envio_res_atrasado: number | null
          sla_lpr_atrasado: number | null
          sla_vri_atrasado: number | null
          tma_dias: number | null
          total_os: number | null
        }
        Relationships: []
      }
      v_tracker_timeline: {
        Row: {
          aging_dias_total: number | null
          cliente: string | null
          etapa_atual: string | null
          etapa1_cra_data: string | null
          etapa2_envio_planilha_data: string | null
          etapa2_status_sla: string | null
          etapa3_status_sla: string | null
          etapa3_vri_data: string | null
          etapa4_vri_resolucao_data: string | null
          etapa5_lpr_data: string | null
          etapa5_status_sla: string | null
          etapa6_receb_resultados_data: string | null
          etapa7_envio_resultados_data: string | null
          etapa7_status_sla: string | null
          etapa8_faturamento_data: string | null
          flag_reagendamento: boolean | null
          id: string | null
          issue_text: string | null
          ordem_servico_ssgen: number | null
          prioridade: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["ordem_servico_ssgen"]
          },
          {
            foreignKeyName: "service_orders_ordem_servico_ssgen_fkey"
            columns: ["ordem_servico_ssgen"]
            isOneToOne: false
            referencedRelation: "vw_orders_unified"
            referencedColumns: ["ordem_servico_ssgen"]
          },
        ]
      }
      vw_orders_powerbi: {
        Row: {
          CLIENTE: string | null
          COD_SSB: string | null
          COORD: string | null
          created_at: string | null
          DT_CRA: string | null
          DT_FATUR_SSG: string | null
          DT_LPR: string | null
          DT_LR: string | null
          DT_PLAN_NEOGEN: string | null
          DT_PLAN_SSG: string | null
          DT_PREV_RESULT_SSG: string | null
          DT_RESULT_SSG: string | null
          DT_SSGEN_OS: string | null
          DT_VRI: string | null
          FATUR_SSG: number | null
          FATUR_TIPO: string | null
          id: string | null
          LIB_CAD_CLIENTE: string | null
          LR_RASTREIO: string | null
          N_AMOSTRAS_NEOGEN: number | null
          N_AMOSTRAS_SSG: number | null
          N_LPR: number | null
          N_LR: number | null
          N_VRI: number | null
          NF_NA_NEOGEN: string | null
          NF_NEOGEM: string | null
          Ord: string | null
          OS_NEOGEN: string | null
          OS_SSGEN: string | null
          PLAN_NEOGEN: string | null
          PLAN_SSG: string | null
          PROD_NEOGEN: string | null
          PROD_SSG: string | null
          REP: string | null
          RESULT_SSG: string | null
          updated_at: string | null
        }
        Insert: {
          CLIENTE?: string | null
          COD_SSB?: string | null
          COORD?: string | null
          created_at?: string | null
          DT_CRA?: string | null
          DT_FATUR_SSG?: string | null
          DT_LPR?: string | null
          DT_LR?: string | null
          DT_PLAN_NEOGEN?: string | null
          DT_PLAN_SSG?: string | null
          DT_PREV_RESULT_SSG?: string | null
          DT_RESULT_SSG?: string | null
          DT_SSGEN_OS?: string | null
          DT_VRI?: string | null
          FATUR_SSG?: number | null
          FATUR_TIPO?: string | null
          id?: never
          LIB_CAD_CLIENTE?: string | null
          LR_RASTREIO?: string | null
          N_AMOSTRAS_NEOGEN?: number | null
          N_AMOSTRAS_SSG?: number | null
          N_LPR?: number | null
          N_LR?: number | null
          N_VRI?: number | null
          NF_NA_NEOGEN?: string | null
          NF_NEOGEM?: string | null
          Ord?: string | null
          OS_NEOGEN?: string | null
          OS_SSGEN?: string | null
          PLAN_NEOGEN?: string | null
          PLAN_SSG?: string | null
          PROD_NEOGEN?: string | null
          PROD_SSG?: string | null
          REP?: string | null
          RESULT_SSG?: string | null
          updated_at?: string | null
        }
        Update: {
          CLIENTE?: string | null
          COD_SSB?: string | null
          COORD?: string | null
          created_at?: string | null
          DT_CRA?: string | null
          DT_FATUR_SSG?: string | null
          DT_LPR?: string | null
          DT_LR?: string | null
          DT_PLAN_NEOGEN?: string | null
          DT_PLAN_SSG?: string | null
          DT_PREV_RESULT_SSG?: string | null
          DT_RESULT_SSG?: string | null
          DT_SSGEN_OS?: string | null
          DT_VRI?: string | null
          FATUR_SSG?: number | null
          FATUR_TIPO?: string | null
          id?: never
          LIB_CAD_CLIENTE?: string | null
          LR_RASTREIO?: string | null
          N_AMOSTRAS_NEOGEN?: number | null
          N_AMOSTRAS_SSG?: number | null
          N_LPR?: number | null
          N_LR?: number | null
          N_VRI?: number | null
          NF_NA_NEOGEN?: string | null
          NF_NEOGEM?: string | null
          Ord?: string | null
          OS_NEOGEN?: string | null
          OS_SSGEN?: string | null
          PLAN_NEOGEN?: string | null
          PLAN_SSG?: string | null
          PROD_NEOGEN?: string | null
          PROD_SSG?: string | null
          REP?: string | null
          RESULT_SSG?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vw_orders_unified: {
        Row: {
          client_created_at: string | null
          cliente_nome: string | null
          cliente_status: string | null
          codigo: number | null
          coordenador: string | null
          cpf_cnpj: number | null
          cra_data: string | null
          cra_status: string | null
          data_cadastro: string | null
          envio_planilha_data: string | null
          envio_planilha_status: string | null
          envio_resultados_data: string | null
          envio_resultados_data_prova: string | null
          envio_resultados_ordem_id: number | null
          envio_resultados_previsao: string | null
          envio_resultados_status: string | null
          id_conta_ssgen: number | null
          ie_rg: number | null
          lpr_data: string | null
          lpr_n_amostras: number | null
          nome_produto: string | null
          numero_amostras: number | null
          numero_nf_neogen: number | null
          ordem_id: string | null
          ordem_servico_neogen: number | null
          ordem_servico_ssgen: number | null
          order_created_at: string | null
          representante: string | null
          updated_at: string | null
          vri_data: string | null
          vri_n_amostras: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_status_sla: {
        Args: { data_fim: string; data_inicio: string; dias_alvo: number }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_profile: {
        Args: never
        Returns: {
          coord: string
          email: string
          id: string
          rep: string
          role: string
        }[]
      }
    }
    Enums: {
      app_role: "ADM" | "GERENTE" | "REPRESENTANTE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADM", "GERENTE", "REPRESENTANTE"],
    },
  },
} as const
