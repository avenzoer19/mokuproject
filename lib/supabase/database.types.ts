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
      annotations: {
        Row: {
          color: string | null
          content: string | null
          created_at: string | null
          id: string
          page_number: number | null
          paper_id: string
          position_x: number | null
          position_y: number | null
          selected_text: string | null
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          page_number?: number | null
          paper_id: string
          position_x?: number | null
          position_y?: number | null
          selected_text?: string | null
          type: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          id?: string
          page_number?: number | null
          paper_id?: string
          position_x?: number | null
          position_y?: number | null
          selected_text?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      experiments: {
        Row: {
          created_at: string | null
          id: string
          results: Json | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          results?: Json | null
          status?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          results?: Json | null
          status?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      lab_logs: {
        Row: {
          actual: string | null
          delta: string | null
          expected: string | null
          id: string
          logged_at: string | null
          notes: string | null
          operator: string | null
          parameter: string | null
          protocol_id: string | null
          status: string | null
          step_title: string | null
          user_id: string
        }
        Insert: {
          actual?: string | null
          delta?: string | null
          expected?: string | null
          id?: string
          notes?: string | null
          operator?: string | null
          parameter?: string | null
          protocol_id?: string | null
          status?: string | null
          step_title?: string | null
          user_id: string
        }
        Update: {
          actual?: string | null
          delta?: string | null
          expected?: string | null
          notes?: string | null
          operator?: string | null
          parameter?: string | null
          status?: string | null
          step_title?: string | null
        }
        Relationships: []
      }
      manuscripts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          status: string | null
          target_journal: string | null
          title: string
          updated_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          content?: string | null
          id?: string
          status?: string | null
          target_journal?: string | null
          title?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          content?: string | null
          status?: string | null
          target_journal?: string | null
          title?: string
          word_count?: number | null
        }
        Relationships: []
      }
      paper_tags: {
        Row: {
          id: string
          paper_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          paper_id: string
          tag_id: string
        }
        Update: {
          paper_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      papers: {
        Row: {
          abstract: string | null
          authors: string | null
          citation_count: number | null
          created_at: string | null
          doi: string | null
          id: string
          is_bookmarked: boolean | null
          journal: string | null
          notes: string | null
          pdf_path: string | null
          pdf_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          abstract?: string | null
          authors?: string | null
          citation_count?: number | null
          doi?: string | null
          id?: string
          is_bookmarked?: boolean | null
          journal?: string | null
          notes?: string | null
          pdf_path?: string | null
          pdf_url?: string | null
          title: string
          user_id: string
          year?: number | null
        }
        Update: {
          abstract?: string | null
          authors?: string | null
          citation_count?: number | null
          doi?: string | null
          is_bookmarked?: boolean | null
          journal?: string | null
          notes?: string | null
          pdf_path?: string | null
          pdf_url?: string | null
          title?: string
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          field: string | null
          full_name: string | null
          id: string
          institution: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          field?: string | null
          full_name?: string | null
          id: string
          institution?: string | null
        }
        Update: {
          avatar_url?: string | null
          field?: string | null
          full_name?: string | null
          institution?: string | null
        }
        Relationships: []
      }
      protocol_steps: {
        Row: {
          created_at: string | null
          description: string | null
          duration_min: number | null
          id: string
          parameters: Json | null
          protocol_id: string
          status: string | null
          step_number: number
          title: string
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          duration_min?: number | null
          id?: string
          parameters?: Json | null
          protocol_id: string
          status?: string | null
          step_number: number
          title: string
        }
        Update: {
          description?: string | null
          duration_min?: number | null
          parameters?: Json | null
          status?: string | null
          step_number?: number
          title?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          description?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      screening_criteria: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          text: string
          type: string
        }
        Insert: {
          id?: string
          session_id: string
          text: string
          type: string
        }
        Update: {
          text?: string
          type?: string
        }
        Relationships: []
      }
      screening_decisions: {
        Row: {
          ai_confidence: number | null
          ai_reasoning: string | null
          created_at: string | null
          decision: string
          id: string
          paper_id: string | null
          reviewer_notes: string | null
          session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          decision: string
          id?: string
          paper_id?: string | null
          reviewer_notes?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          decision?: string
          reviewer_notes?: string | null
        }
        Relationships: []
      }
      screening_sessions: {
        Row: {
          created_at: string | null
          done_count: number | null
          id: string
          status: string
          title: string
          total_papers: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          done_count?: number | null
          id?: string
          status?: string
          title?: string
          total_papers?: number | null
          user_id: string
        }
        Update: {
          done_count?: number | null
          status?: string
          title?: string
          total_papers?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          active_protocols: number | null
          annotation_count: number | null
          bookmarked_count: number | null
          completed_screenings: number | null
          manuscript_count: number | null
          paper_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Convenience aliases
export type Paper         = Tables<'papers'>
export type Annotation    = Tables<'annotations'>
export type Tag           = Tables<'tags'>
export type Manuscript    = Tables<'manuscripts'>
export type Protocol      = Tables<'protocols'>
export type ProtocolStep  = Tables<'protocol_steps'>
export type LabLog        = Tables<'lab_logs'>
export type ScreeningSession  = Tables<'screening_sessions'>
export type ScreeningDecision = Tables<'screening_decisions'>
export type Profile       = Tables<'profiles'>
