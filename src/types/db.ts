// Auto-generated types from Supabase schema (0001_init.sql)
// Run: supabase gen types typescript --local > src/types/db.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          created_at: string
          external_id: string | null
          group: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          kickoff_at: string
          round_label: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          external_id?: string | null
          group?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at: string
          round_label?: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          external_id?: string | null
          group?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          kickoff_at?: string
          round_label?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          away_pick: number
          created_at: string
          home_pick: number
          id: string
          match_id: string
          points_awarded: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          away_pick: number
          created_at?: string
          home_pick: number
          id?: string
          match_id: string
          points_awarded?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          away_pick?: number
          created_at?: string
          home_pick?: number
          id?: string
          match_id?: string
          points_awarded?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          champion_team_id: string | null
          created_at: string
          id: string
          is_admin: boolean
          nick: string
        }
        Insert: {
          champion_team_id?: string | null
          created_at?: string
          id: string
          is_admin?: boolean
          nick: string
        }
        Update: {
          champion_team_id?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          nick?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          champion_locked_at: string | null
          championship_bonus_points: number
          id: number
          tournament_started: boolean
        }
        Insert: {
          champion_locked_at?: string | null
          championship_bonus_points?: number
          id?: number
          tournament_started?: boolean
        }
        Update: {
          champion_locked_at?: string | null
          championship_bonus_points?: number
          id?: number
          tournament_started?: boolean
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          external_id: string | null
          flag_url: string
          group: string | null
          id: string
          name: string
          short_name: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          flag_url?: string
          group?: string | null
          id?: string
          name: string
          short_name: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          flag_url?: string
          group?: string | null
          id?: string
          name?: string
          short_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          champion_bonus: number | null
          exact_hits: number | null
          match_points: number | null
          nick: string | null
          predicted_count: number | null
          result_hits: number | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      recalc_match_points: {
        Args: { p_match_id: string }
        Returns: undefined
      }
    }
    Enums: {
      match_stage: "group" | "r32" | "r16" | "qf" | "sf" | "final"
      match_status: "scheduled" | "live" | "finished" | "postponed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience aliases
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

// Named table types
export type Profile = Tables<"profiles">
export type Team = Tables<"teams">
export type Match = Tables<"matches">
export type Prediction = Tables<"predictions">
export type Settings = Tables<"settings">
export type LeaderboardRow = Database["public"]["Views"]["leaderboard"]["Row"]
export type MatchStage = Enums<"match_stage">
export type MatchStatus = Enums<"match_status">
