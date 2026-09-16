/**
 * 이 파일은 손으로 고치지 않는다. — CLAUDE.md 아키텍처 규칙 5
 *
 *   supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * 아직 Supabase 프로젝트가 없어서 `supabase/migrations/20260916000001_init.sql`의
 * 스키마를 그대로 옮겨 적어 둔 상태다. 프로젝트를 만든 뒤 위 명령으로 덮어쓰면 된다.
 * 파생 타입은 전부 `src/types/models.ts`에서 이 파일을 참조한다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: Database["public"]["Enums"]["job_status"];
          thumbnail_path: string | null;
          error_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: Database["public"]["Enums"]["job_status"];
          thumbnail_path?: string | null;
          error_code?: string | null;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      character_refs: {
        Row: {
          id: string;
          character_id: string;
          angle: Database["public"]["Enums"]["ref_angle"];
          image_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          angle: Database["public"]["Enums"]["ref_angle"];
          image_path: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "character_refs_character_id_fkey";
            columns: ["character_id"];
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
        ];
      };
      presets: {
        Row: {
          id: string;
          slot: Database["public"]["Enums"]["preset_slot"];
          name: string;
          description: string | null;
          thumbnail_path: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          slot: Database["public"]["Enums"]["preset_slot"];
          name: string;
          description?: string | null;
          thumbnail_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: never;
        Relationships: [];
      };
      looks: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          name: string;
          hair_preset_id: string;
          top_preset_id: string;
          bottom_preset_id: string;
          scene_preset_id: string;
          status: Database["public"]["Enums"]["job_status"];
          thumbnail_path: string | null;
          is_adopted: boolean;
          error_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          name: string;
          hair_preset_id: string;
          top_preset_id: string;
          bottom_preset_id: string;
          scene_preset_id: string;
          status?: Database["public"]["Enums"]["job_status"];
        };
        Update: {
          name?: string;
          is_adopted?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "looks_character_id_fkey";
            columns: ["character_id"];
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          look_id: string | null;
          status: Database["public"]["Enums"]["job_status"];
          source_video_path: string | null;
          result_video_path: string | null;
          thumbnail_path: string | null;
          duration_seconds: number | null;
          credits_spent: number;
          error_code: string | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          look_id?: string | null;
          source_video_path?: string | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "jobs_character_id_fkey";
            columns: ["character_id"];
            referencedRelation: "characters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_look_id_fkey";
            columns: ["look_id"];
            referencedRelation: "looks";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_ledger: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          balance_after: number;
          reason: Database["public"]["Enums"]["ledger_reason"];
          job_id: string | null;
          memo: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "credit_ledger_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      job_status: "queued" | "processing" | "done" | "failed";
      ref_angle: "front" | "left45" | "right45" | "left90" | "right90";
      preset_slot: "hair" | "top" | "bottom" | "scene";
      ledger_reason:
        | "signup_bonus"
        | "job_charge"
        | "job_refund"
        | "character_charge"
        | "character_refund"
        | "look_charge"
        | "look_refund"
        | "purchase"
        | "adjustment";
    };
    CompositeTypes: Record<never, never>;
  };
};
