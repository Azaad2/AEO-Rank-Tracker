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
      ab_test_assignments: {
        Row: {
          created_at: string
          id: string
          session_id: string
          test_name: string
          variant_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          test_name: string
          variant_key: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          test_name?: string
          variant_key?: string
        }
        Relationships: []
      }
      ab_test_conversions: {
        Row: {
          conversion_type: string
          created_at: string
          id: string
          session_id: string
          test_name: string
          variant_key: string
        }
        Insert: {
          conversion_type: string
          created_at?: string
          id?: string
          session_id: string
          test_name: string
          variant_key: string
        }
        Update: {
          conversion_type?: string
          created_at?: string
          id?: string
          session_id?: string
          test_name?: string
          variant_key?: string
        }
        Relationships: []
      }
      ab_test_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          test_name: string
          variant_key: string
          variant_value: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          test_name: string
          variant_key: string
          variant_value: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          test_name?: string
          variant_key?: string
          variant_value?: string
          weight?: number
        }
        Relationships: []
      }
      auto_optimizations: {
        Row: {
          blog_outlines: Json | null
          content_suggestions: Json | null
          created_at: string
          faq_schema: string | null
          id: string
          meta_rewrites: Json | null
          scan_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          blog_outlines?: Json | null
          content_suggestions?: Json | null
          created_at?: string
          faq_schema?: string | null
          id?: string
          meta_rewrites?: Json | null
          scan_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          blog_outlines?: Json | null
          content_suggestions?: Json | null
          created_at?: string
          faq_schema?: string | null
          id?: string
          meta_rewrites?: Json | null
          scan_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_optimizations_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          paid_at: string | null
          pdf_sent_at: string | null
          scan_id: string | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          paid_at?: string | null
          pdf_sent_at?: string | null
          scan_id?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          paid_at?: string | null
          pdf_sent_at?: string | null
          scan_id?: string | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_scans: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          ip_address: string | null
          scan_date: string
          scan_id: string | null
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          ip_address?: string | null
          scan_date?: string
          scan_id?: string | null
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          ip_address?: string | null
          scan_date?: string
          scan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_scans_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          scan_id: string | null
          status: string
          title: string
          tool_link: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          scan_id?: string | null
          status?: string
          title: string
          tool_link?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          scan_id?: string | null
          status?: string
          title?: string
          tool_link?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_tasks_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          chat_limit: number | null
          created_at: string | null
          features: Json | null
          id: string
          name: string
          price_monthly: number
          prompts_limit: number
          razorpay_plan_id: string | null
          scans_limit: number
        }
        Insert: {
          chat_limit?: number | null
          created_at?: string | null
          features?: Json | null
          id: string
          name: string
          price_monthly?: number
          prompts_limit?: number
          razorpay_plan_id?: string | null
          scans_limit?: number
        }
        Update: {
          chat_limit?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          name?: string
          price_monthly?: number
          prompts_limit?: number
          razorpay_plan_id?: string | null
          scans_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_results: {
        Row: {
          citation_rank: number | null
          cited: boolean | null
          created_at: string
          gemini_cited: boolean | null
          gemini_competitors: string[] | null
          gemini_mentioned: boolean | null
          gemini_response: string | null
          id: number
          mentioned: boolean | null
          prompt: string
          scan_id: string
          top_cited_domains: string[] | null
          used_results: string[] | null
        }
        Insert: {
          citation_rank?: number | null
          cited?: boolean | null
          created_at?: string
          gemini_cited?: boolean | null
          gemini_competitors?: string[] | null
          gemini_mentioned?: boolean | null
          gemini_response?: string | null
          id?: number
          mentioned?: boolean | null
          prompt: string
          scan_id: string
          top_cited_domains?: string[] | null
          used_results?: string[] | null
        }
        Update: {
          citation_rank?: number | null
          cited?: boolean | null
          created_at?: string
          gemini_cited?: boolean | null
          gemini_competitors?: string[] | null
          gemini_mentioned?: boolean | null
          gemini_response?: string | null
          id?: number
          mentioned?: boolean | null
          prompt?: string
          scan_id?: string
          top_cited_domains?: string[] | null
          used_results?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_results_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          created_at: string
          id: string
          market: string
          project_domain: string
          prompts: string[]
          score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          market?: string
          project_domain: string
          prompts: string[]
          score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          market?: string
          project_domain?: string
          prompts?: string[]
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      slack_alert_history: {
        Row: {
          alert_type: string
          config_id: string | null
          id: string
          message_ts: string | null
          scan_id: string | null
          sent_at: string | null
        }
        Insert: {
          alert_type: string
          config_id?: string | null
          id?: string
          message_ts?: string | null
          scan_id?: string | null
          sent_at?: string | null
        }
        Update: {
          alert_type?: string
          config_id?: string | null
          id?: string
          message_ts?: string | null
          scan_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slack_alert_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "slack_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_alert_history_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_configs: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          notify_on_scan: boolean | null
          score_threshold: number | null
          updated_at: string | null
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          notify_on_scan?: boolean | null
          score_threshold?: number | null
          updated_at?: string | null
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          notify_on_scan?: boolean | null
          score_threshold?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          chat_messages_used: number | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          id: string
          plan_id: string | null
          prompts_used: number | null
          razorpay_subscription_id: string | null
          scans_used: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chat_messages_used?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          id?: string
          plan_id?: string | null
          prompts_used?: number | null
          razorpay_subscription_id?: string | null
          scans_used?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chat_messages_used?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          id?: string
          plan_id?: string | null
          prompts_used?: number | null
          razorpay_subscription_id?: string | null
          scans_used?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          created_at: string
          event_metadata: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_metadata?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_metadata?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_guest_scan_limit: {
        Args: { p_fingerprint: string }
        Returns: boolean
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
  public: {
    Enums: {},
  },
} as const
