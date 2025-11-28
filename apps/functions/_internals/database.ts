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
      card_media: {
        Row: {
          card_id: number
          media_asset_id: number
          role: string | null
          sort_order: number | null
        }
        Insert: {
          card_id: number
          media_asset_id: number
          role?: string | null
          sort_order?: number | null
        }
        Update: {
          card_id?: number
          media_asset_id?: number
          role?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_media_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      card_regions: {
        Row: {
          card_id: number
          coords: Json
          created_at: string | null
          id: number
          is_correct: boolean | null
          label: string | null
          media_asset_id: number
          shape: string | null
          sort_order: number | null
        }
        Insert: {
          card_id: number
          coords: Json
          created_at?: string | null
          id?: number
          is_correct?: boolean | null
          label?: string | null
          media_asset_id: number
          shape?: string | null
          sort_order?: number | null
        }
        Update: {
          card_id?: number
          coords?: Json
          created_at?: string | null
          id?: number
          is_correct?: boolean | null
          label?: string | null
          media_asset_id?: number
          shape?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_regions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_regions_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      card_standards: {
        Row: {
          card_id: number
          standard_id: number
        }
        Insert: {
          card_id: number
          standard_id: number
        }
        Update: {
          card_id?: number
          standard_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_standards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_tags: {
        Row: {
          card_id: number
          tag_id: number
        }
        Insert: {
          card_id: number
          tag_id: number
        }
        Update: {
          card_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_tags_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      card_topics: {
        Row: {
          card_id: number
          topic_id: number
        }
        Insert: {
          card_id: number
          topic_id: number
        }
        Update: {
          card_id?: number
          topic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_topics_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          age_max: number | null
          age_min: number | null
          answer_text: string | null
          bloom_level: string | null
          created_at: string | null
          deck_id: number
          difficulty: string | null
          id: number
          is_active: boolean | null
          language_code: string | null
          learning_objective: string | null
          prompt_text: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          answer_text?: string | null
          bloom_level?: string | null
          created_at?: string | null
          deck_id: number
          difficulty?: string | null
          id?: number
          is_active?: boolean | null
          language_code?: string | null
          learning_objective?: string | null
          prompt_text: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          answer_text?: string | null
          bloom_level?: string | null
          created_at?: string | null
          deck_id?: number
          difficulty?: string | null
          id?: number
          is_active?: boolean | null
          language_code?: string | null
          learning_objective?: string | null
          prompt_text?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_grade_levels: {
        Row: {
          deck_id: number
          grade_level_id: number
        }
        Insert: {
          deck_id: number
          grade_level_id: number
        }
        Update: {
          deck_id?: number
          grade_level_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deck_grade_levels_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_grade_levels_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_standards: {
        Row: {
          deck_id: number
          standard_id: number
        }
        Insert: {
          deck_id: number
          standard_id: number
        }
        Update: {
          deck_id?: number
          standard_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deck_standards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_standards_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_subjects: {
        Row: {
          deck_id: number
          subject_id: number
        }
        Insert: {
          deck_id: number
          subject_id: number
        }
        Update: {
          deck_id?: number
          subject_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deck_subjects_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_tags: {
        Row: {
          deck_id: number
          tag_id: number
        }
        Insert: {
          deck_id: number
          tag_id: number
        }
        Update: {
          deck_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deck_tags_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_topics: {
        Row: {
          deck_id: number
          topic_id: number
        }
        Insert: {
          deck_id: number
          topic_id: number
        }
        Update: {
          deck_id?: number
          topic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "deck_topics_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          created_at: string | null
          default_bloom_level: string | null
          default_difficulty: string | null
          description: string | null
          id: number
          language_code: string | null
          owner: string
          title: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          default_bloom_level?: string | null
          default_difficulty?: string | null
          description?: string | null
          id?: number
          language_code?: string | null
          owner: string
          title: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          default_bloom_level?: string | null
          default_difficulty?: string | null
          description?: string | null
          id?: number
          language_code?: string | null
          owner?: string
          title?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      grade_levels: {
        Row: {
          code: string
          created_at: string | null
          id: number
          label: string
          level_type: string
          parent_id: number | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
          label: string
          level_type: string
          parent_id?: number | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          label?: string
          level_type?: string
          parent_id?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_levels_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      ingest_files: {
        Row: {
          created_at: string | null
          id: number
          meta: Json | null
          mime_type: string
          owner: string
          source: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          meta?: Json | null
          mime_type: string
          owner: string
          source?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string | null
          id?: number
          meta?: Json | null
          mime_type?: string
          owner?: string
          source?: string | null
          storage_path?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          created_at: string | null
          created_by: string | null
          error: string | null
          id: number
          input: Json
          output: Json | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: number
          input: Json
          output?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: number
          input?: Json
          output?: Json | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          captions_path: string | null
          created_at: string | null
          duration_seconds: number | null
          height_px: number | null
          id: number
          license: string | null
          mime_type: string
          owner: string
          source_url: string | null
          storage_path: string
          transcript_path: string | null
          type: string
          width_px: number | null
        }
        Insert: {
          alt_text?: string | null
          captions_path?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          height_px?: number | null
          id?: number
          license?: string | null
          mime_type: string
          owner: string
          source_url?: string | null
          storage_path: string
          transcript_path?: string | null
          type: string
          width_px?: number | null
        }
        Update: {
          alt_text?: string | null
          captions_path?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          height_px?: number | null
          id?: number
          license?: string | null
          mime_type?: string
          owner?: string
          source_url?: string | null
          storage_path?: string
          transcript_path?: string | null
          type?: string
          width_px?: number | null
        }
        Relationships: []
      }
      quiz_attempt_answers: {
        Row: {
          attempt_id: number
          id: number
          is_correct: boolean | null
          quiz_item_id: number
          response_json: Json
          score_awarded: number | null
          time_taken_ms: number | null
        }
        Insert: {
          attempt_id: number
          id?: number
          is_correct?: boolean | null
          quiz_item_id: number
          response_json: Json
          score_awarded?: number | null
          time_taken_ms?: number | null
        }
        Update: {
          attempt_id?: number
          id?: number
          is_correct?: boolean | null
          quiz_item_id?: number
          response_json?: Json
          score_awarded?: number | null
          time_taken_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_quiz_item_id_fkey"
            columns: ["quiz_item_id"]
            isOneToOne: false
            referencedRelation: "quiz_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          details_json: Json | null
          id: number
          passed: boolean | null
          quiz_id: number
          score_pct: number | null
          score_raw: number | null
          started_at: string | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          details_json?: Json | null
          id?: number
          passed?: boolean | null
          quiz_id: number
          score_pct?: number | null
          score_raw?: number | null
          started_at?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          details_json?: Json | null
          id?: number
          passed?: boolean | null
          quiz_id?: number
          score_pct?: number | null
          score_raw?: number | null
          started_at?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_blueprints: {
        Row: {
          constraints_json: Json
          created_at: string | null
          deck_id: number | null
          id: number
          name: string
          owner: string
        }
        Insert: {
          constraints_json: Json
          created_at?: string | null
          deck_id?: number | null
          id?: number
          name: string
          owner: string
        }
        Update: {
          constraints_json?: Json
          created_at?: string | null
          deck_id?: number | null
          id?: number
          name?: string
          owner?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_blueprints_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_items: {
        Row: {
          id: number
          item_type: string
          media_snapshot: Json | null
          metadata_json: Json | null
          options_json: Json | null
          origin_card_id: number | null
          quiz_id: number
          scoring_json: Json
          sort_order: number | null
          stem: string
        }
        Insert: {
          id?: number
          item_type: string
          media_snapshot?: Json | null
          metadata_json?: Json | null
          options_json?: Json | null
          origin_card_id?: number | null
          quiz_id: number
          scoring_json: Json
          sort_order?: number | null
          stem: string
        }
        Update: {
          id?: number
          item_type?: string
          media_snapshot?: Json | null
          metadata_json?: Json | null
          options_json?: Json | null
          origin_card_id?: number | null
          quiz_id?: number
          scoring_json?: Json
          sort_order?: number | null
          stem?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_items_origin_card_id_fkey"
            columns: ["origin_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_items_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          blueprint_id: number | null
          created_at: string | null
          deck_id: number | null
          id: number
          mode: string | null
          owner: string
          settings_json: Json | null
          time_limit_seconds: number | null
          title: string
        }
        Insert: {
          blueprint_id?: number | null
          created_at?: string | null
          deck_id?: number | null
          id?: number
          mode?: string | null
          owner: string
          settings_json?: Json | null
          time_limit_seconds?: number | null
          title: string
        }
        Update: {
          blueprint_id?: number | null
          created_at?: string | null
          deck_id?: number | null
          id?: number
          mode?: string | null
          owner?: string
          settings_json?: Json | null
          time_limit_seconds?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "quiz_blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      standards: {
        Row: {
          code: string
          created_at: string | null
          description: string
          framework: string
          id: number
          jurisdiction: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description: string
          framework: string
          id?: number
          jurisdiction?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string
          framework?: string
          id?: number
          jurisdiction?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string | null
          id: number
          name: string
          parent_id: number | null
          path: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          parent_id?: number | null
          path: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          parent_id?: number | null
          path?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: number
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: number
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string | null
          id: number
          name: string
          parent_id: number | null
          path: string
          slug: string
          sort_order: number | null
          subject_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          parent_id?: number | null
          path: string
          slug: string
          sort_order?: number | null
          subject_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          parent_id?: number | null
          path?: string
          slug?: string
          sort_order?: number | null
          subject_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "topics_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          language_preference: string | null
          timezone: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          language_preference?: string | null
          timezone?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          language_preference?: string | null
          timezone?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: { Args: { data: string }; Returns: string }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
