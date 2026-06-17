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
      daily_summaries: {
        Row: {
          display_name: string
          generated_at: string
          matches_covered: Json
          persona: string
          summary: string
        }
        Insert: {
          display_name: string
          generated_at?: string
          matches_covered?: Json
          persona: string
          summary: string
        }
        Update: {
          display_name?: string
          generated_at?: string
          matches_covered?: Json
          persona?: string
          summary?: string
        }
        Relationships: []
      }
      expert_opinions: {
        Row: {
          display_name: string
          generated_at: string
          intro: string
          persona: string
          picks: Json
        }
        Insert: {
          display_name: string
          generated_at?: string
          intro: string
          persona: string
          picks?: Json
        }
        Update: {
          display_name?: string
          generated_at?: string
          intro?: string
          persona?: string
          picks?: Json
        }
        Relationships: []
      }
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
      player_points_history: {
        Row: {
          user_id: string | null
          prediction_id: string | null
          match_id: string | null
          kickoff_at: string | null
          stage: Database["public"]["Enums"]["match_stage"] | null
          group: string | null
          round_label: string | null
          home_score: number | null
          away_score: number | null
          status: Database["public"]["Enums"]["match_status"] | null
          home_team_name: string | null
          home_team_short: string | null
          home_team_flag: string | null
          away_team_name: string | null
          away_team_short: string | null
          away_team_flag: string | null
          home_pick: number | null
          away_pick: number | null
          points_awarded: number | null
          cumulative_points: number | null
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
export type PlayerPointsHistoryRow = Database["public"]["Views"]["player_points_history"]["Row"]
export type ExpertOpinion = Tables<"expert_opinions">
export type MatchStage = Enums<"match_stage">
export type MatchStatus = Enums<"match_status">
