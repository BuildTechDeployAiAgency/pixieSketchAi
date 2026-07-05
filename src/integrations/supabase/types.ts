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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_email?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      credit_limits: {
        Row: {
          alert_threshold: number
          created_at: string | null
          hard_limit_enabled: boolean
          id: string
          is_active: boolean
          period_end: string
          period_name: string
          period_start: string
          total_limit: number
          updated_at: string | null
          used_credits: number
        }
        Insert: {
          alert_threshold?: number
          created_at?: string | null
          hard_limit_enabled?: boolean
          id?: string
          is_active?: boolean
          period_end?: string
          period_name?: string
          period_start?: string
          total_limit?: number
          updated_at?: string | null
          used_credits?: number
        }
        Update: {
          alert_threshold?: number
          created_at?: string | null
          hard_limit_enabled?: boolean
          id?: string
          is_active?: boolean
          period_end?: string
          period_name?: string
          period_start?: string
          total_limit?: number
          updated_at?: string | null
          used_credits?: number
        }
        Relationships: []
      }
      credit_usage_log: {
        Row: {
          budget_period_id: string | null
          created_at: string | null
          credits_used: number
          id: string
          operation_type: string
          sketch_id: string | null
          user_id: string | null
        }
        Insert: {
          budget_period_id?: string | null
          created_at?: string | null
          credits_used: number
          id?: string
          operation_type?: string
          sketch_id?: string | null
          user_id?: string | null
        }
        Update: {
          budget_period_id?: string | null
          created_at?: string | null
          credits_used?: number
          id?: string
          operation_type?: string
          sketch_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_usage_log_budget_period_id_fkey"
            columns: ["budget_period_id"]
            isOneToOne: false
            referencedRelation: "credit_limits"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          credits_purchased: number
          currency: string | null
          customer_email: string
          id: string
          package_name: string
          payment_status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          credits_purchased: number
          currency?: string | null
          customer_email: string
          id?: string
          package_name: string
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          credits_purchased?: number
          currency?: string | null
          customer_email?: string
          id?: string
          package_name?: string
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credits: number
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits?: number
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sketches: {
        Row: {
          animated_image_url: string | null
          content_type: string
          created_at: string
          fal_request_id: string | null
          id: string
          is_new: boolean
          name: string
          original_image_url: string | null
          preset: string | null
          status: string
          updated_at: string
          user_id: string
          video_prompt: string | null
        }
        Insert: {
          animated_image_url?: string | null
          content_type?: string
          created_at?: string
          fal_request_id?: string | null
          id?: string
          is_new?: boolean
          name: string
          original_image_url?: string | null
          preset?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_prompt?: string | null
        }
        Update: {
          animated_image_url?: string | null
          content_type?: string
          created_at?: string
          fal_request_id?: string | null
          id?: string
          is_new?: boolean
          name?: string
          original_image_url?: string | null
          preset?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_prompt?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string
          id: string
          page_count: number
          sketch_id: string
          status: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_count?: number
          sketch_id: string
          status?: string
          theme: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_count?: number
          sketch_id?: string
          status?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_sketch_id_fkey"
            columns: ["sketch_id"]
            isOneToOne: false
            referencedRelation: "sketches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_pages: {
        Row: {
          created_at: string
          id: string
          illustration_url: string | null
          page_number: number
          story_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          illustration_url?: string | null
          page_number: number
          story_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          illustration_url?: string | null
          page_number?: number
          story_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_payment_history: {
        Row: {
          amount_dollars: number | null
          created_at: string | null
          credits_purchased: number | null
          currency: string | null
          id: string | null
          package_name: string | null
          payment_status: string | null
          status_display: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_dollars?: never
          created_at?: string | null
          credits_purchased?: number | null
          currency?: string | null
          id?: string | null
          package_name?: string | null
          payment_status?: string | null
          status_display?: never
          stripe_session_id?: string | null
        }
        Update: {
          amount_dollars?: never
          created_at?: string | null
          credits_purchased?: number | null
          currency?: string | null
          id?: string | null
          package_name?: string | null
          payment_status?: string | null
          status_display?: never
          stripe_session_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_create_budget_period: {
        Args: {
          p_alert_threshold?: number
          p_hard_limit_enabled?: boolean
          p_period_end: string
          p_period_name: string
          p_period_start: string
          p_total_limit: number
        }
        Returns: Json
      }
      admin_get_budget_stats: { Args: never; Returns: Json }
      admin_get_stats: { Args: never; Returns: Json }
      admin_give_credits: {
        Args: { credit_amount: number; target_user_id: string }
        Returns: boolean
      }
      admin_reset_all_credits: { Args: never; Returns: number }
      check_budget_limit: { Args: { credits_to_use?: number }; Returns: Json }
      deduct_credits_atomic: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      deduct_user_credit: { Args: { user_uuid: string }; Returns: boolean }
      get_active_budget_period: {
        Args: never
        Returns: {
          alert_threshold: number
          created_at: string | null
          hard_limit_enabled: boolean
          id: string
          is_active: boolean
          period_end: string
          period_name: string
          period_start: string
          total_limit: number
          updated_at: string | null
          used_credits: number
        }
        SetofOptions: {
          from: "*"
          to: "credit_limits"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_credits: { Args: { user_uuid: string }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          action_details?: Json
          action_name: string
          target_email?: string
          target_user_id?: string
        }
        Returns: undefined
      }
      log_credit_usage: {
        Args: {
          p_credits_used: number
          p_operation_type?: string
          p_sketch_id?: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
