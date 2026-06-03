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
      brand_aliases: {
        Row: {
          alias: string
          canonical_name: string
          created_at: string
          id: string
        }
        Insert: {
          alias: string
          canonical_name: string
          created_at?: string
          id?: string
        }
        Update: {
          alias?: string
          canonical_name?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      brand_observations: {
        Row: {
          brand_name: string
          cited: boolean | null
          created_at: string
          engine: string
          id: string
          is_customer_brand: boolean
          normalized_name: string
          position: number | null
          scan_result_id: number
        }
        Insert: {
          brand_name: string
          cited?: boolean | null
          created_at?: string
          engine: string
          id?: string
          is_customer_brand?: boolean
          normalized_name: string
          position?: number | null
          scan_result_id: number
        }
        Update: {
          brand_name?: string
          cited?: boolean | null
          created_at?: string
          engine?: string
          id?: string
          is_customer_brand?: boolean
          normalized_name?: string
          position?: number | null
          scan_result_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_observations_scan_result_id_fkey"
            columns: ["scan_result_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
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
      citation_sources: {
        Row: {
          authority_refreshed_at: string
          authority_score: number
          classification_method: string
          classified_at: string
          domain: string
          domain_type: string
          metadata: Json | null
        }
        Insert: {
          authority_refreshed_at?: string
          authority_score?: number
          classification_method?: string
          classified_at?: string
          domain: string
          domain_type: string
          metadata?: Json | null
        }
        Update: {
          authority_refreshed_at?: string
          authority_score?: number
          classification_method?: string
          classified_at?: string
          domain?: string
          domain_type?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      citations: {
        Row: {
          asset_type: string | null
          cites_brand: string | null
          created_at: string
          domain: string
          engine: string
          id: string
          position: number | null
          scan_result_id: number
          source_type: string | null
          title: string | null
          url: string
        }
        Insert: {
          asset_type?: string | null
          cites_brand?: string | null
          created_at?: string
          domain: string
          engine: string
          id?: string
          position?: number | null
          scan_result_id: number
          source_type?: string | null
          title?: string | null
          url: string
        }
        Update: {
          asset_type?: string | null
          cites_brand?: string | null
          created_at?: string
          domain?: string
          engine?: string
          id?: string
          position?: number | null
          scan_result_id?: number
          source_type?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "citations_scan_result_id_fkey"
            columns: ["scan_result_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          asset_type: string
          authority_score: number | null
          brand_name: string
          citation_count: number
          domain: string | null
          first_seen: string
          id: string
          industry_id: string | null
          last_seen: string
          normalized_brand: string
          source_type: string | null
          title: string | null
          url: string
        }
        Insert: {
          asset_type: string
          authority_score?: number | null
          brand_name: string
          citation_count?: number
          domain?: string | null
          first_seen?: string
          id?: string
          industry_id?: string | null
          last_seen?: string
          normalized_brand: string
          source_type?: string | null
          title?: string | null
          url: string
        }
        Update: {
          asset_type?: string
          authority_score?: number | null
          brand_name?: string
          citation_count?: number
          domain?: string | null
          first_seen?: string
          id?: string
          industry_id?: string | null
          last_seen?: string
          normalized_brand?: string
          source_type?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      engine_weights: {
        Row: {
          engine: string
          last_updated: string
          weight: number
        }
        Insert: {
          engine: string
          last_updated?: string
          weight: number
        }
        Update: {
          engine?: string
          last_updated?: string
          weight?: number
        }
        Relationships: []
      }
      global_intelligence: {
        Row: {
          citation_domain: string | null
          created_at: string
          engine: string
          id: string
          industry_id: string | null
          observation_count: number
          period_end: string
          period_start: string
          prompt_template_hash: string
          source_type: string | null
          topic_cluster_id: string | null
          winning_brand: string | null
        }
        Insert: {
          citation_domain?: string | null
          created_at?: string
          engine: string
          id?: string
          industry_id?: string | null
          observation_count?: number
          period_end?: string
          period_start?: string
          prompt_template_hash: string
          source_type?: string | null
          topic_cluster_id?: string | null
          winning_brand?: string | null
        }
        Update: {
          citation_domain?: string | null
          created_at?: string
          engine?: string
          id?: string
          industry_id?: string | null
          observation_count?: number
          period_end?: string
          period_start?: string
          prompt_template_hash?: string
          source_type?: string | null
          topic_cluster_id?: string | null
          winning_brand?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_intelligence_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_intelligence_topic_cluster_id_fkey"
            columns: ["topic_cluster_id"]
            isOneToOne: false
            referencedRelation: "topic_clusters"
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
      industries: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          prompt_seed_pack: string[] | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          prompt_seed_pack?: string[] | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          prompt_seed_pack?: string[] | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "industries_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_leaderboard: {
        Row: {
          brand: string
          citation_authority_score: number | null
          computed_at: string
          delta_vs_previous: number | null
          id: string
          industry_id: string
          observation_count: number
          period: string
          rank: number
          recommendation_strength: number | null
          rss: number
          top_sources: Json | null
          topic_cluster_id: string | null
          trust_source_density: number | null
        }
        Insert: {
          brand: string
          citation_authority_score?: number | null
          computed_at?: string
          delta_vs_previous?: number | null
          id?: string
          industry_id: string
          observation_count?: number
          period?: string
          rank?: number
          recommendation_strength?: number | null
          rss?: number
          top_sources?: Json | null
          topic_cluster_id?: string | null
          trust_source_density?: number | null
        }
        Update: {
          brand?: string
          citation_authority_score?: number | null
          computed_at?: string
          delta_vs_previous?: number | null
          id?: string
          industry_id?: string
          observation_count?: number
          period?: string
          rank?: number
          recommendation_strength?: number | null
          rss?: number
          top_sources?: Json | null
          topic_cluster_id?: string | null
          trust_source_density?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "industry_leaderboard_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_leaderboard_topic_cluster_id_fkey"
            columns: ["topic_cluster_id"]
            isOneToOne: false
            referencedRelation: "topic_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_prompts: {
        Row: {
          created_at: string
          domain: string
          id: string
          prompts: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          prompts: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          prompts?: string[]
          updated_at?: string
        }
        Relationships: []
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
          auto_monitor_limit: number
          chat_limit: number | null
          created_at: string | null
          features: Json | null
          id: string
          name: string
          paypal_plan_id: string | null
          price_monthly: number
          prompts_limit: number
          razorpay_plan_id: string | null
          scans_limit: number
          suggested_prompts_limit: number
        }
        Insert: {
          auto_monitor_limit?: number
          chat_limit?: number | null
          created_at?: string | null
          features?: Json | null
          id: string
          name: string
          paypal_plan_id?: string | null
          price_monthly?: number
          prompts_limit?: number
          razorpay_plan_id?: string | null
          scans_limit?: number
          suggested_prompts_limit?: number
        }
        Update: {
          auto_monitor_limit?: number
          chat_limit?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          name?: string
          paypal_plan_id?: string | null
          price_monthly?: number
          prompts_limit?: number
          razorpay_plan_id?: string | null
          scans_limit?: number
          suggested_prompts_limit?: number
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
      proprietary_metrics_cache: {
        Row: {
          cag: number | null
          cag_breakdown: Json | null
          cis_top: Json | null
          coi: Json | null
          computed_at: string
          confidence_score: number | null
          deltas: Json | null
          explanation: Json | null
          id: string
          metrics: Json | null
          narrative: string | null
          previous_scan_id: string | null
          rss: number | null
          rss_breakdown: Json | null
          sample_size: Json | null
          scan_id: string
          tsd: number | null
          tsd_breakdown: Json | null
        }
        Insert: {
          cag?: number | null
          cag_breakdown?: Json | null
          cis_top?: Json | null
          coi?: Json | null
          computed_at?: string
          confidence_score?: number | null
          deltas?: Json | null
          explanation?: Json | null
          id?: string
          metrics?: Json | null
          narrative?: string | null
          previous_scan_id?: string | null
          rss?: number | null
          rss_breakdown?: Json | null
          sample_size?: Json | null
          scan_id: string
          tsd?: number | null
          tsd_breakdown?: Json | null
        }
        Update: {
          cag?: number | null
          cag_breakdown?: Json | null
          cis_top?: Json | null
          coi?: Json | null
          computed_at?: string
          confidence_score?: number | null
          deltas?: Json | null
          explanation?: Json | null
          id?: string
          metrics?: Json | null
          narrative?: string | null
          previous_scan_id?: string | null
          rss?: number | null
          rss_breakdown?: Json | null
          sample_size?: Json | null
          scan_id?: string
          tsd?: number | null
          tsd_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "proprietary_metrics_cache_previous_scan_id_fkey"
            columns: ["previous_scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proprietary_metrics_cache_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: true
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_outcomes: {
        Row: {
          actual_impact: number | null
          baseline_rss: number | null
          id: string
          measured_at: string
          recommendation_id: string
          rss_after_14_days: number | null
          rss_after_30_days: number | null
          success_flag: boolean | null
          user_id: string
        }
        Insert: {
          actual_impact?: number | null
          baseline_rss?: number | null
          id?: string
          measured_at?: string
          recommendation_id: string
          rss_after_14_days?: number | null
          rss_after_30_days?: number | null
          success_flag?: boolean | null
          user_id: string
        }
        Update: {
          actual_impact?: number | null
          baseline_rss?: number | null
          id?: string
          measured_at?: string
          recommendation_id?: string
          rss_after_14_days?: number | null
          rss_after_30_days?: number | null
          success_flag?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_outcomes_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          category: string
          completed_at: string | null
          confidence: number
          created_at: string
          description: string | null
          difficulty: string
          evidence: Json
          expected_impact: number
          id: string
          scan_id: string | null
          status: string
          time_estimate_minutes: number | null
          title: string
          tool_link: string | null
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          confidence?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          evidence: Json
          expected_impact?: number
          id?: string
          scan_id?: string | null
          status?: string
          time_estimate_minutes?: number | null
          title: string
          tool_link?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          confidence?: number
          created_at?: string
          description?: string | null
          difficulty?: string
          evidence?: Json
          expected_impact?: number
          id?: string
          scan_id?: string | null
          status?: string
          time_estimate_minutes?: number | null
          title?: string
          tool_link?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
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
          chatgpt_cited: boolean | null
          chatgpt_competitors: string[] | null
          chatgpt_mentioned: boolean | null
          chatgpt_response: string | null
          citation_rank: number | null
          citation_urls: Json | null
          cited: boolean | null
          claude_cited: boolean | null
          claude_competitors: string[] | null
          claude_mentioned: boolean | null
          claude_response: string | null
          created_at: string
          gemini_cited: boolean | null
          gemini_competitors: string[] | null
          gemini_mentioned: boolean | null
          gemini_response: string | null
          id: number
          mentioned: boolean | null
          perplexity_cited: boolean | null
          perplexity_competitors: string[] | null
          perplexity_mentioned: boolean | null
          perplexity_response: string | null
          prompt: string
          scan_id: string
          top_cited_domains: string[] | null
          used_results: string[] | null
        }
        Insert: {
          chatgpt_cited?: boolean | null
          chatgpt_competitors?: string[] | null
          chatgpt_mentioned?: boolean | null
          chatgpt_response?: string | null
          citation_rank?: number | null
          citation_urls?: Json | null
          cited?: boolean | null
          claude_cited?: boolean | null
          claude_competitors?: string[] | null
          claude_mentioned?: boolean | null
          claude_response?: string | null
          created_at?: string
          gemini_cited?: boolean | null
          gemini_competitors?: string[] | null
          gemini_mentioned?: boolean | null
          gemini_response?: string | null
          id?: number
          mentioned?: boolean | null
          perplexity_cited?: boolean | null
          perplexity_competitors?: string[] | null
          perplexity_mentioned?: boolean | null
          perplexity_response?: string | null
          prompt: string
          scan_id: string
          top_cited_domains?: string[] | null
          used_results?: string[] | null
        }
        Update: {
          chatgpt_cited?: boolean | null
          chatgpt_competitors?: string[] | null
          chatgpt_mentioned?: boolean | null
          chatgpt_response?: string | null
          citation_rank?: number | null
          citation_urls?: Json | null
          cited?: boolean | null
          claude_cited?: boolean | null
          claude_competitors?: string[] | null
          claude_mentioned?: boolean | null
          claude_response?: string | null
          created_at?: string
          gemini_cited?: boolean | null
          gemini_competitors?: string[] | null
          gemini_mentioned?: boolean | null
          gemini_response?: string | null
          id?: number
          mentioned?: boolean | null
          perplexity_cited?: boolean | null
          perplexity_competitors?: string[] | null
          perplexity_mentioned?: boolean | null
          perplexity_response?: string | null
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
          industry_id: string | null
          is_auto_scan: boolean
          language: string | null
          market: string
          project_domain: string
          prompts: string[]
          score: number | null
          topic_cluster_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry_id?: string | null
          is_auto_scan?: boolean
          language?: string | null
          market?: string
          project_domain: string
          prompts: string[]
          score?: number | null
          topic_cluster_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry_id?: string | null
          is_auto_scan?: boolean
          language?: string | null
          market?: string
          project_domain?: string
          prompts?: string[]
          score?: number | null
          topic_cluster_id?: string | null
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
          paypal_subscription_id: string | null
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
          paypal_subscription_id?: string | null
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
          paypal_subscription_id?: string | null
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      topic_clusters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry_id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry_id: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry_id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_clusters_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_brand: { Args: { input: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
