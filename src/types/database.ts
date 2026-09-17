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
    PostgrestVersion: "14.5"
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
      character_images: {
        Row: {
          angle: Database["public"]["Enums"]["ref_angle"] | null
          character_id: string
          created_at: string
          error_code: string | null
          id: string
          image_path: string | null
          kind: Database["public"]["Enums"]["character_image_kind"]
          round: number
          source_image_path: string | null
          status: Database["public"]["Enums"]["job_status"]
          traits: Json
          updated_at: string
        }
        Insert: {
          angle?: Database["public"]["Enums"]["ref_angle"] | null
          character_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          image_path?: string | null
          kind: Database["public"]["Enums"]["character_image_kind"]
          round?: number
          source_image_path?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          traits?: Json
          updated_at?: string
        }
        Update: {
          angle?: Database["public"]["Enums"]["ref_angle"] | null
          character_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          image_path?: string | null
          kind?: Database["public"]["Enums"]["character_image_kind"]
          round?: number
          source_image_path?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          traits?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_images_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_options: {
        Row: {
          description: string | null
          gender_id: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["character_option_kind"]
          name: string
          prompt: string
          sort_order: number
          thumbnail_path: string | null
        }
        Insert: {
          description?: string | null
          gender_id?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["character_option_kind"]
          name: string
          prompt: string
          sort_order?: number
          thumbnail_path?: string | null
        }
        Update: {
          description?: string | null
          gender_id?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["character_option_kind"]
          name?: string
          prompt?: string
          sort_order?: number
          thumbnail_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_options_gender_id_fkey"
            columns: ["gender_id"]
            isOneToOne: false
            referencedRelation: "character_options"
            referencedColumns: ["id"]
          },
        ]
      }
      character_refs: {
        Row: {
          angle: Database["public"]["Enums"]["ref_angle"]
          character_id: string
          created_at: string
          id: string
          image_path: string
        }
        Insert: {
          angle: Database["public"]["Enums"]["ref_angle"]
          character_id: string
          created_at?: string
          id?: string
          image_path: string
        }
        Update: {
          angle?: Database["public"]["Enums"]["ref_angle"]
          character_id?: string
          created_at?: string
          id?: string
          image_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_refs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          base_image_path: string | null
          created_at: string
          error_code: string | null
          id: string
          name: string
          stage: Database["public"]["Enums"]["character_stage"]
          status: Database["public"]["Enums"]["job_status"]
          thumbnail_path: string | null
          tone_id: string | null
          traits: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          base_image_path?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          name: string
          stage?: Database["public"]["Enums"]["character_stage"]
          status?: Database["public"]["Enums"]["job_status"]
          thumbnail_path?: string | null
          tone_id?: string | null
          traits?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          base_image_path?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          name?: string
          stage?: Database["public"]["Enums"]["character_stage"]
          status?: Database["public"]["Enums"]["job_status"]
          thumbnail_path?: string | null
          tone_id?: string | null
          traits?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_tone_id_fkey"
            columns: ["tone_id"]
            isOneToOne: false
            referencedRelation: "character_options"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          job_id: string | null
          memo: string | null
          reason: Database["public"]["Enums"]["ledger_reason"]
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          job_id?: string | null
          memo?: string | null
          reason: Database["public"]["Enums"]["ledger_reason"]
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          job_id?: string | null
          memo?: string | null
          reason?: Database["public"]["Enums"]["ledger_reason"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          character_id: string
          completed_at: string | null
          created_at: string
          credits_spent: number
          duration_seconds: number | null
          error_code: string | null
          id: string
          look_id: string | null
          result_video_path: string | null
          source_video_path: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          thumbnail_path: string | null
          user_id: string
        }
        Insert: {
          character_id: string
          completed_at?: string | null
          created_at?: string
          credits_spent?: number
          duration_seconds?: number | null
          error_code?: string | null
          id?: string
          look_id?: string | null
          result_video_path?: string | null
          source_video_path?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          thumbnail_path?: string | null
          user_id: string
        }
        Update: {
          character_id?: string
          completed_at?: string | null
          created_at?: string
          credits_spent?: number
          duration_seconds?: number | null
          error_code?: string | null
          id?: string
          look_id?: string | null
          result_video_path?: string | null
          source_video_path?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          thumbnail_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "looks"
            referencedColumns: ["id"]
          },
        ]
      }
      looks: {
        Row: {
          bottom_preset_id: string | null
          character_id: string
          created_at: string
          error_code: string | null
          hair_preset_id: string | null
          id: string
          is_adopted: boolean
          name: string
          outfit_preset_id: string | null
          scene_preset_id: string
          status: Database["public"]["Enums"]["job_status"]
          thumbnail_path: string | null
          top_preset_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bottom_preset_id?: string | null
          character_id: string
          created_at?: string
          error_code?: string | null
          hair_preset_id?: string | null
          id?: string
          is_adopted?: boolean
          name: string
          outfit_preset_id?: string | null
          scene_preset_id: string
          status?: Database["public"]["Enums"]["job_status"]
          thumbnail_path?: string | null
          top_preset_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bottom_preset_id?: string | null
          character_id?: string
          created_at?: string
          error_code?: string | null
          hair_preset_id?: string | null
          id?: string
          is_adopted?: boolean
          name?: string
          outfit_preset_id?: string | null
          scene_preset_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          thumbnail_path?: string | null
          top_preset_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "looks_bottom_preset_id_fkey"
            columns: ["bottom_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "looks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "looks_hair_preset_id_fkey"
            columns: ["hair_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "looks_outfit_preset_id_fkey"
            columns: ["outfit_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "looks_scene_preset_id_fkey"
            columns: ["scene_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "looks_top_preset_id_fkey"
            columns: ["top_preset_id"]
            isOneToOne: false
            referencedRelation: "presets"
            referencedColumns: ["id"]
          },
        ]
      }
      presets: {
        Row: {
          category: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          prompt: string
          slot: Database["public"]["Enums"]["preset_slot"]
          sort_order: number
          thumbnail_path: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          prompt?: string
          slot: Database["public"]["Enums"]["preset_slot"]
          sort_order?: number
          thumbnail_path?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prompt?: string
          slot?: Database["public"]["Enums"]["preset_slot"]
          sort_order?: number
          thumbnail_path?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      charge_credits: {
        Args: {
          p_amount: number
          p_job_id?: string
          p_memo?: string
          p_reason: Database["public"]["Enums"]["ledger_reason"]
          p_user_id: string
        }
        Returns: number
      }
      finish_character_batch: {
        Args: {
          p_character_id: string
          p_kind: Database["public"]["Enums"]["character_image_kind"]
          p_round: number
        }
        Returns: string
      }
      refund_credits: {
        Args: {
          p_amount: number
          p_job_id?: string
          p_memo?: string
          p_reason: Database["public"]["Enums"]["ledger_reason"]
          p_user_id: string
        }
        Returns: number
      }
      select_character_image: {
        Args: { p_character_id: string; p_image_id: string }
        Returns: string
      }
    }
    Enums: {
      character_image_kind: "candidate" | "refined" | "view"
      character_option_kind:
        | "tone"
        | "gender"
        | "age"
        | "hair"
        | "hair_color"
        | "body"
        | "vibe"
      character_stage: "draft" | "refining" | "building" | "ready"
      job_status: "queued" | "processing" | "done" | "failed"
      ledger_reason:
        | "signup_bonus"
        | "job_charge"
        | "job_refund"
        | "purchase"
        | "adjustment"
        | "character_charge"
        | "character_refund"
        | "look_charge"
        | "look_refund"
        | "character_draft_charge"
        | "character_draft_refund"
        | "character_edit_charge"
        | "character_edit_refund"
      preset_slot: "hair" | "top" | "bottom" | "scene" | "outfit"
      ref_angle: "front" | "left45" | "right45" | "left90" | "right90"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {
      character_image_kind: ["candidate", "refined", "view"],
      character_option_kind: [
        "tone",
        "gender",
        "age",
        "hair",
        "hair_color",
        "body",
        "vibe",
      ],
      character_stage: ["draft", "refining", "building", "ready"],
      job_status: ["queued", "processing", "done", "failed"],
      ledger_reason: [
        "signup_bonus",
        "job_charge",
        "job_refund",
        "purchase",
        "adjustment",
        "character_charge",
        "character_refund",
        "look_charge",
        "look_refund",
        "character_draft_charge",
        "character_draft_refund",
        "character_edit_charge",
        "character_edit_refund",
      ],
      preset_slot: ["hair", "top", "bottom", "scene", "outfit"],
      ref_angle: ["front", "left45", "right45", "left90", "right90"],
    },
  },
} as const
