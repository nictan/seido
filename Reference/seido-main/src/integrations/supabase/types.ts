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
      grading_configurations: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_available: boolean
          rank_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          is_available?: boolean
          rank_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_available?: boolean
          rank_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_configurations_rank_id_fkey"
            columns: ["rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_history: {
        Row: {
          certificate_url: string | null
          created_at: string
          decided_at: string
          grade_after: Json | null
          grading_id: string
          id: string
          notes: string | null
          remarks: string | null
          result: Database["public"]["Enums"]["grading_status"]
          student_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          decided_at?: string
          grade_after?: Json | null
          grading_id: string
          id?: string
          notes?: string | null
          remarks?: string | null
          result: Database["public"]["Enums"]["grading_status"]
          student_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          decided_at?: string
          grade_after?: Json | null
          grading_id?: string
          id?: string
          notes?: string | null
          remarks?: string | null
          result?: Database["public"]["Enums"]["grading_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_history_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "gradings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      grading_periods: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          grading_date: string
          id: string
          location: string | null
          max_applications: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          grading_date: string
          id?: string
          location?: string | null
          max_applications?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          grading_date?: string
          id?: string
          location?: string | null
          max_applications?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gradings: {
        Row: {
          achieved_rank_id: string | null
          application_decided_at: string | null
          application_decided_by: string | null
          application_remarks: string | null
          application_status:
            | Database["public"]["Enums"]["application_status"]
            | null
          certificate_url: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          grade_at_application: Json | null
          grading_notes: string | null
          grading_period_id: string | null
          id: string
          indemnity: Json | null
          rank_at_application_id: string | null
          requested_grade: Json
          requested_rank_id: string | null
          status: Database["public"]["Enums"]["grading_status"]
          student_id: string
          submitted_at: string
          updated_at: string
          visible_remarks: string | null
        }
        Insert: {
          achieved_rank_id?: string | null
          application_decided_at?: string | null
          application_decided_by?: string | null
          application_remarks?: string | null
          application_status?:
            | Database["public"]["Enums"]["application_status"]
            | null
          certificate_url?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          grade_at_application?: Json | null
          grading_notes?: string | null
          grading_period_id?: string | null
          id?: string
          indemnity?: Json | null
          rank_at_application_id?: string | null
          requested_grade: Json
          requested_rank_id?: string | null
          status?: Database["public"]["Enums"]["grading_status"]
          student_id: string
          submitted_at?: string
          updated_at?: string
          visible_remarks?: string | null
        }
        Update: {
          achieved_rank_id?: string | null
          application_decided_at?: string | null
          application_decided_by?: string | null
          application_remarks?: string | null
          application_status?:
            | Database["public"]["Enums"]["application_status"]
            | null
          certificate_url?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          grade_at_application?: Json | null
          grading_notes?: string | null
          grading_period_id?: string | null
          id?: string
          indemnity?: Json | null
          rank_at_application_id?: string | null
          requested_grade?: Json
          requested_rank_id?: string | null
          status?: Database["public"]["Enums"]["grading_status"]
          student_id?: string
          submitted_at?: string
          updated_at?: string
          visible_remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gradings_achieved_rank_id_fkey"
            columns: ["achieved_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradings_application_decided_by_fkey"
            columns: ["application_decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gradings_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gradings_grading_period_id_fkey"
            columns: ["grading_period_id"]
            isOneToOne: false
            referencedRelation: "grading_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradings_rank_at_application_id_fkey"
            columns: ["rank_at_application_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradings_requested_rank_id_fkey"
            columns: ["requested_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_grade: Json | null
          current_rank_id: string | null
          date_of_birth: string
          dojo: Database["public"]["Enums"]["dojo_type"]
          email: string
          emergency_contact_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          is_admin: boolean
          is_instructor: boolean
          is_student: boolean
          last_name: string
          mobile: string
          profile_picture_url: string | null
          rank_effective_date: string | null
          remarks: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_grade?: Json | null
          current_rank_id?: string | null
          date_of_birth: string
          dojo: Database["public"]["Enums"]["dojo_type"]
          email: string
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_admin?: boolean
          is_instructor?: boolean
          is_student?: boolean
          last_name: string
          mobile: string
          profile_picture_url?: string | null
          rank_effective_date?: string | null
          remarks?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_grade?: Json | null
          current_rank_id?: string | null
          date_of_birth?: string
          dojo?: Database["public"]["Enums"]["dojo_type"]
          email?: string
          emergency_contact_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_admin?: boolean
          is_instructor?: boolean
          is_student?: boolean
          last_name?: string
          mobile?: string
          profile_picture_url?: string | null
          rank_effective_date?: string | null
          remarks?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_rank_id_fkey"
            columns: ["current_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
        ]
      }
      ranks: {
        Row: {
          belt_color: string
          created_at: string
          dan: number | null
          display_name: string
          id: string
          is_default_rank: boolean | null
          kyu: number | null
          rank_order: number
          stripes: number | null
          updated_at: string
        }
        Insert: {
          belt_color: string
          created_at?: string
          dan?: number | null
          display_name: string
          id?: string
          is_default_rank?: boolean | null
          kyu?: number | null
          rank_order: number
          stripes?: number | null
          updated_at?: string
        }
        Update: {
          belt_color?: string
          created_at?: string
          dan?: number | null
          display_name?: string
          id?: string
          is_default_rank?: boolean | null
          kyu?: number | null
          rank_order?: number
          stripes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      referee_question_banks: {
        Row: {
          created_at: string
          description: string | null
          discipline: Database["public"]["Enums"]["karate_discipline"]
          exam_type: Database["public"]["Enums"]["exam_type"]
          id: string
          is_active: boolean
          name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discipline: Database["public"]["Enums"]["karate_discipline"]
          exam_type: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discipline?: Database["public"]["Enums"]["karate_discipline"]
          exam_type?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      referee_questions: {
        Row: {
          category: string | null
          correct_answer: boolean
          created_at: string
          explanation: string | null
          id: string
          question_bank_id: string
          question_number: number
          question_text: string
          rule_reference: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          correct_answer: boolean
          created_at?: string
          explanation?: string | null
          id?: string
          question_bank_id: string
          question_number: number
          question_text: string
          rule_reference?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          correct_answer?: boolean
          created_at?: string
          explanation?: string | null
          id?: string
          question_bank_id?: string
          question_number?: number
          question_text?: string
          rule_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referee_questions_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "referee_question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      referee_rule_documents: {
        Row: {
          category: Database["public"]["Enums"]["rule_category"]
          created_at: string
          description: string | null
          display_order: number
          effective_date: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["rule_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          effective_date?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["rule_category"]
          created_at?: string
          description?: string | null
          display_order?: number
          effective_date?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      user_flashcard_progress: {
        Row: {
          confidence_level: number
          created_at: string
          id: string
          next_review_at: string | null
          question_id: string
          times_correct: number
          times_reviewed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_level?: number
          created_at?: string
          id?: string
          next_review_at?: string | null
          question_id: string
          times_correct?: number
          times_reviewed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_level?: number
          created_at?: string
          id?: string
          next_review_at?: string | null
          question_id?: string
          times_correct?: number
          times_reviewed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_progress_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "referee_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          created_at: string
          id: string
          percentage: number | null
          question_bank_id: string
          score: number
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          percentage?: number | null
          question_bank_id: string
          score: number
          time_taken_seconds?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          percentage?: number | null
          question_bank_id?: string
          score?: number
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "referee_question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_study_progress: {
        Row: {
          created_at: string
          id: string
          last_studied_at: string | null
          question_bank_id: string
          questions_attempted: number
          questions_correct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_studied_at?: string | null
          question_bank_id: string
          questions_attempted?: number
          questions_correct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_studied_at?: string | null
          question_bank_id?: string
          questions_attempted?: number
          questions_correct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_study_progress_question_bank_id_fkey"
            columns: ["question_bank_id"]
            isOneToOne: false
            referencedRelation: "referee_question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_grading_application: {
        Args: {
          p_indemnity: Json
          p_requested_grade: Json
          p_requested_rank_id: string
          p_student_id: string
        }
        Returns: string
      }
      is_instructor: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      application_status: "Submitted" | "Approved" | "Rejected"
      dojo_type: "TP" | "SIT" | "HQ"
      exam_type: "referee" | "coach"
      gender_type: "Male" | "Female" | "Other"
      grading_status: "Pending" | "Pass" | "Fail"
      karate_discipline: "kumite" | "kata"
      rule_category:
        | "kumite"
        | "kata"
        | "para_karate"
        | "ranking"
        | "protocol"
        | "disciplinary"
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
      application_status: ["Submitted", "Approved", "Rejected"],
      dojo_type: ["TP", "SIT", "HQ"],
      exam_type: ["referee", "coach"],
      gender_type: ["Male", "Female", "Other"],
      grading_status: ["Pending", "Pass", "Fail"],
      karate_discipline: ["kumite", "kata"],
      rule_category: [
        "kumite",
        "kata",
        "para_karate",
        "ranking",
        "protocol",
        "disciplinary",
      ],
    },
  },
} as const
