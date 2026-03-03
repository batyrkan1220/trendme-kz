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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          niche: string | null
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          niche?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          niche?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
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
          assigned_by: string | null
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          note: string | null
          plan_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          note?: string | null
          plan_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          plan_id?: string
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
          likes: number | null
          niche: string | null
          platform: string
          platform_video_id: string
          published_at: string | null
          region: string
          shares: number | null
          source_query_id: string | null
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
          likes?: number | null
          niche?: string | null
          platform?: string
          platform_video_id: string
          published_at?: string | null
          region?: string
          shares?: number | null
          source_query_id?: string | null
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
          likes?: number | null
          niche?: string | null
          platform?: string
          platform_video_id?: string
          published_at?: string | null
          region?: string
          shares?: number | null
          source_query_id?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
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
