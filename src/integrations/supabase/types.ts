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
    }
    Functions: {
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
