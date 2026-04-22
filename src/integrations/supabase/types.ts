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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts_tracked: {
        Row: {
          analysis_json: Json | null
          avatar_url: string | null
          bio: string | null
          bio_link: string | null
          created_at: string
          fetched_at: string
          followers: number | null
          following: number | null
          id: string
          profile_url: string
          total_likes: number | null
          total_videos: number | null
          user_id: string
          username: string
          verified: boolean | null
        }
        Insert: {
          analysis_json?: Json | null
          avatar_url?: string | null
          bio?: string | null
          bio_link?: string | null
          created_at?: string
          fetched_at?: string
          followers?: number | null
          following?: number | null
          id?: string
          profile_url: string
          total_likes?: number | null
          total_videos?: number | null
          user_id: string
          username: string
          verified?: boolean | null
        }
        Update: {
          analysis_json?: Json | null
          avatar_url?: string | null
          bio?: string | null
          bio_link?: string | null
          created_at?: string
          fetched_at?: string
          followers?: number | null
          following?: number | null
          id?: string
          profile_url?: string
          total_likes?: number | null
          total_videos?: number | null
          user_id?: string
          username?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          created_at: string
          id: string
          payload_json: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload_json?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload_json?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          new_expires_at: string | null
          new_plan: string | null
          old_expires_at: string | null
          old_plan: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_expires_at?: string | null
          new_plan?: string | null
          old_expires_at?: string | null
          old_plan?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_expires_at?: string | null
          new_plan?: string | null
          old_expires_at?: string | null
          old_plan?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage_log: {
        Row: {
          action: string
          created_at: string
          credits_used: number
          function_name: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          credits_used?: number
          function_name: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          credits_used?: number
          function_name?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_username: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_username: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_username?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cleanup_logs: {
        Row: {
          broken: number
          checked: number
          created_at: string
          deleted: number
          id: string
          source: string
        }
        Insert: {
          broken?: number
          checked?: number
          created_at?: string
          deleted?: number
          id?: string
          source?: string
        }
        Update: {
          broken?: number
          checked?: number
          created_at?: string
          deleted?: number
          id?: string
          source?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          author_username: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          status: string
          user_id: string
          video_id: string
          video_url: string
        }
        Insert: {
          author_username?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          status?: string
          user_id: string
          video_id: string
          video_url: string
        }
        Update: {
          author_username?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          status?: string
          user_id?: string
          video_id?: string
          video_url?: string
        }
        Relationships: []
      }
      cover_refresh_logs: {
        Row: {
          current_offset: number
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          total_failed: number
          total_updated: number
          total_videos: number
          triggered_by: string | null
        }
        Insert: {
          current_offset?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_failed?: number
          total_updated?: number
          total_videos?: number
          triggered_by?: string | null
        }
        Update: {
          current_offset?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_failed?: number
          total_updated?: number
          total_videos?: number
          triggered_by?: string | null
        }
        Relationships: []
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
      eula_acceptances: {
        Row: {
          accepted_at: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          user_id: string
          version?: string
        }
        Update: {
          accepted_at?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          bank_code: string | null
          bonus_days: number
          card_mask: string | null
          commission: number | null
          computed_expires_at: string | null
          created_at: string
          failure_code: string | null
          failure_description: string | null
          id: string
          mcc: string | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_organization: string | null
          pg_payment_id: string | null
          phone: string | null
          plan_id: string
          previous_plan_id: string | null
          previous_plan_name: string | null
          purchase_type: string | null
          refund_amount: number | null
          refund_failure_description: string | null
          refund_id: string | null
          refund_initiated_at: string | null
          refund_initiated_by: string | null
          refund_reason: string | null
          refund_status: string | null
          refunded_at: string | null
          remaining_days_carried: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_code?: string | null
          bonus_days?: number
          card_mask?: string | null
          commission?: number | null
          computed_expires_at?: string | null
          created_at?: string
          failure_code?: string | null
          failure_description?: string | null
          id?: string
          mcc?: string | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_organization?: string | null
          pg_payment_id?: string | null
          phone?: string | null
          plan_id: string
          previous_plan_id?: string | null
          previous_plan_name?: string | null
          purchase_type?: string | null
          refund_amount?: number | null
          refund_failure_description?: string | null
          refund_id?: string | null
          refund_initiated_at?: string | null
          refund_initiated_by?: string | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          remaining_days_carried?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_code?: string | null
          bonus_days?: number
          card_mask?: string | null
          commission?: number | null
          computed_expires_at?: string | null
          created_at?: string
          failure_code?: string | null
          failure_description?: string | null
          id?: string
          mcc?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_organization?: string | null
          pg_payment_id?: string | null
          phone?: string | null
          plan_id?: string
          previous_plan_id?: string | null
          previous_plan_name?: string | null
          purchase_type?: string | null
          refund_amount?: number | null
          refund_failure_description?: string | null
          refund_id?: string | null
          refund_initiated_at?: string | null
          refund_initiated_by?: string | null
          refund_reason?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          remaining_days_carried?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          max_requests: number
          max_tracked_accounts: number
          name: string
          price_rub: number
          sort_order: number
          tokens_included: number
          updated_at: string
          usage_limits: Json | null
        }
        Insert: {
          created_at?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          max_requests?: number
          max_tracked_accounts?: number
          name: string
          price_rub?: number
          sort_order?: number
          tokens_included?: number
          updated_at?: string
          usage_limits?: Json | null
        }
        Update: {
          created_at?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          max_requests?: number
          max_tracked_accounts?: number
          name?: string
          price_rub?: number
          sort_order?: number
          tokens_included?: number
          updated_at?: string
          usage_limits?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          created_at: string
          experience: string | null
          free_analyses_left: number
          free_scripts_left: number
          goal: string | null
          id: string
          is_banned: boolean
          is_deleted: boolean
          name: string | null
          niche: string | null
          onboarding_completed: boolean
          phone: string | null
          platform: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          experience?: string | null
          free_analyses_left?: number
          free_scripts_left?: number
          goal?: string | null
          id?: string
          is_banned?: boolean
          is_deleted?: boolean
          name?: string | null
          niche?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          platform?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          experience?: string | null
          free_analyses_left?: number
          free_scripts_left?: number
          goal?: string | null
          id?: string
          is_banned?: boolean
          is_deleted?: boolean
          name?: string | null
          niche?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          platform?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recat_logs: {
        Row: {
          current_offset: number
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          total_processed: number
          total_unchanged: number
          total_updated: number
          total_videos: number
          triggered_by: string | null
        }
        Insert: {
          current_offset?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_processed?: number
          total_unchanged?: number
          total_updated?: number
          total_videos?: number
          triggered_by?: string | null
        }
        Update: {
          current_offset?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          total_processed?: number
          total_unchanged?: number
          total_updated?: number
          total_videos?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      saved_scripts: {
        Row: {
          content: string
          created_at: string
          id: string
          source_video_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          source_video_url?: string | null
          title?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          source_video_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          created_at: string
          id: string
          last_run_at: string
          query_text: string
          total_results_saved: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_run_at?: string
          query_text: string
          total_results_saved?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_run_at?: string
          query_text?: string
          total_results_saved?: number | null
          user_id?: string
        }
        Relationships: []
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
      token_pricing: {
        Row: {
          action_key: string
          action_label: string
          cost: number
          id: string
          updated_at: string
        }
        Insert: {
          action_key: string
          action_label: string
          cost?: number
          id?: string
          updated_at?: string
        }
        Update: {
          action_key?: string
          action_label?: string
          cost?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      trend_niche_cursors: {
        Row: {
          cursor: number
          id: string
          niche: string
          updated_at: string
        }
        Insert: {
          cursor?: number
          id?: string
          niche: string
          updated_at?: string
        }
        Update: {
          cursor?: number
          id?: string
          niche?: string
          updated_at?: string
        }
        Relationships: []
      }
      trend_refresh_logs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          general_saved: number | null
          id: string
          mode: string
          niche_stats: Json | null
          started_at: string
          status: string
          total_saved: number | null
          triggered_by: string | null
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          general_saved?: number | null
          id?: string
          mode?: string
          niche_stats?: Json | null
          started_at?: string
          status?: string
          total_saved?: number | null
          triggered_by?: string | null
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          general_saved?: number | null
          id?: string
          mode?: string
          niche_stats?: Json | null
          started_at?: string
          status?: string
          total_saved?: number | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      trend_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount_paid: number | null
          assigned_by: string | null
          bonus_days: number
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          note: string | null
          order_id: string | null
          payment_provider: string | null
          plan_id: string
          previous_plan_name: string | null
          remaining_days_carried: number
          started_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          assigned_by?: string | null
          bonus_days?: number
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          note?: string | null
          order_id?: string | null
          payment_provider?: string | null
          plan_id: string
          previous_plan_name?: string | null
          remaining_days_carried?: number
          started_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          assigned_by?: string | null
          bonus_days?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          order_id?: string | null
          payment_provider?: string | null
          plan_id?: string
          previous_plan_name?: string | null
          remaining_days_carried?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tokens: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_analysis: {
        Row: {
          analyzed_at: string
          comments_json: Json | null
          id: string
          platform_video_id: string | null
          summary_json: Json | null
          transcript_text: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          analyzed_at?: string
          comments_json?: Json | null
          id?: string
          platform_video_id?: string | null
          summary_json?: Json | null
          transcript_text?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          analyzed_at?: string
          comments_json?: Json | null
          id?: string
          platform_video_id?: string | null
          summary_json?: Json | null
          transcript_text?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          author_avatar_url: string | null
          author_display_name: string | null
          author_username: string | null
          caption: string | null
          categories: string[] | null
          comments: number | null
          cover_url: string | null
          created_at: string
          duration_sec: number | null
          fetched_at: string
          id: string
          lang: string | null
          likes: number | null
          niche: string | null
          platform: string
          platform_video_id: string
          play_url: string | null
          play_url_fetched_at: string | null
          published_at: string | null
          region: string
          shares: number | null
          source_query_id: string | null
          sub_niche: string | null
          trend_score: number | null
          url: string
          velocity_comments: number | null
          velocity_likes: number | null
          velocity_views: number | null
          views: number | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_display_name?: string | null
          author_username?: string | null
          caption?: string | null
          categories?: string[] | null
          comments?: number | null
          cover_url?: string | null
          created_at?: string
          duration_sec?: number | null
          fetched_at?: string
          id?: string
          lang?: string | null
          likes?: number | null
          niche?: string | null
          platform?: string
          platform_video_id: string
          play_url?: string | null
          play_url_fetched_at?: string | null
          published_at?: string | null
          region?: string
          shares?: number | null
          source_query_id?: string | null
          sub_niche?: string | null
          trend_score?: number | null
          url: string
          velocity_comments?: number | null
          velocity_likes?: number | null
          velocity_views?: number | null
          views?: number | null
        }
        Update: {
          author_avatar_url?: string | null
          author_display_name?: string | null
          author_username?: string | null
          caption?: string | null
          categories?: string[] | null
          comments?: number | null
          cover_url?: string | null
          created_at?: string
          duration_sec?: number | null
          fetched_at?: string
          id?: string
          lang?: string | null
          likes?: number | null
          niche?: string | null
          platform?: string
          platform_video_id?: string
          play_url?: string | null
          play_url_fetched_at?: string | null
          published_at?: string | null
          region?: string
          shares?: number | null
          source_query_id?: string | null
          sub_niche?: string | null
          trend_score?: number | null
          url?: string
          velocity_comments?: number | null
          velocity_likes?: number | null
          velocity_views?: number | null
          views?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_downgrade_expired_subscriptions: { Args: never; Returns: Json }
      consume_free_credit: { Args: { _kind: string }; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      spend_tokens: {
        Args: { _action_key: string; _description?: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
