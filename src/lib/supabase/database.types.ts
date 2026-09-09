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
      activities: {
        Row: {
          created_at: string
          description: string
          id: string
          lesson_id: string
          page_id: string | null
          sequence: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          lesson_id: string
          page_id?: string | null
          sequence?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lesson_id?: string
          page_id?: string | null
          sequence?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "lesson_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          id: string
          lesson_id: string
          page_id: string | null
          sequence: number
          title: string
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Insert: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          lesson_id: string
          page_id?: string | null
          sequence?: number
          title: string
          type?: Database["public"]["Enums"]["assessment_type"]
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          lesson_id?: string
          page_id?: string | null
          sequence?: number
          title?: string
          type?: Database["public"]["Enums"]["assessment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "lesson_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          title: string
          topic_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      curricula: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          name: string
          published_at: string | null
          space_id: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          published_at?: string | null
          space_id: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          published_at?: string | null
          space_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "curricula_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_evaluations: {
        Row: {
          achievement_rate: number
          created_at: string
          curriculum_id: string
          id: string
          period: string
        }
        Insert: {
          achievement_rate?: number
          created_at?: string
          curriculum_id: string
          id?: string
          period: string
        }
        Update: {
          achievement_rate?: number
          created_at?: string
          curriculum_id?: string
          id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_evaluations_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_goals: {
        Row: {
          created_at: string
          curriculum_id: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          description: string
          id?: string
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_goals_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_nodes: {
        Row: {
          created_at: string
          curriculum_node_id: number
          parent_node_id: number | null
          title: string
          type_id: number | null
        }
        Insert: {
          created_at?: string
          curriculum_node_id?: number
          parent_node_id?: number | null
          title: string
          type_id?: number | null
        }
        Update: {
          created_at?: string
          curriculum_node_id?: number
          parent_node_id?: number | null
          title?: string
          type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "curriculum_nodes"
            referencedColumns: ["curriculum_node_id"]
          },
          {
            foreignKeyName: "curriculum_nodes_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "node_types"
            referencedColumns: ["type_id"]
          },
        ]
      }
      ecosystem_nodes: {
        Row: {
          created_at: string
          name: string
          node_id: number
          parent_node_id: number | null
          type_id: number | null
        }
        Insert: {
          created_at?: string
          name: string
          node_id?: number
          parent_node_id?: number | null
          type_id?: number | null
        }
        Update: {
          created_at?: string
          name?: string
          node_id?: number
          parent_node_id?: number | null
          type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_nodes"
            referencedColumns: ["node_id"]
          },
          {
            foreignKeyName: "ecosystem_nodes_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "node_types"
            referencedColumns: ["type_id"]
          },
        ]
      }
      ecosystem_staff: {
        Row: {
          assigned_at: string
          ecosystem_id: string
          role: Database["public"]["Enums"]["ecosystem_staff_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          ecosystem_id: string
          role: Database["public"]["Enums"]["ecosystem_staff_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          ecosystem_id?: string
          role?: Database["public"]["Enums"]["ecosystem_staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_staff_ecosystem_id_fkey"
            columns: ["ecosystem_id"]
            isOneToOne: false
            referencedRelation: "ecosystems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystems: {
        Row: {
          badge_url: string | null
          calendar_year: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_private: boolean
          mission: string | null
          name: string
          raw_ecosystem_meta_data: Json
          slug: string
          theme_accent: string | null
          theme_primary: string | null
          theme_supporting: string
          type: Database["public"]["Enums"]["ecosystem_type"]
          vision: string | null
        }
        Insert: {
          badge_url?: string | null
          calendar_year?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean
          mission?: string | null
          name: string
          raw_ecosystem_meta_data?: Json
          slug: string
          theme_accent?: string | null
          theme_primary?: string | null
          theme_supporting?: string
          type?: Database["public"]["Enums"]["ecosystem_type"]
          vision?: string | null
        }
        Update: {
          badge_url?: string | null
          calendar_year?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean
          mission?: string | null
          name?: string
          raw_ecosystem_meta_data?: Json
          slug?: string
          theme_accent?: string | null
          theme_primary?: string | null
          theme_supporting?: string
          type?: Database["public"]["Enums"]["ecosystem_type"]
          vision?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecosystems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_enrollments: {
        Row: {
          academic_year: string
          created_at: string
          enrollment_id: number
          grade_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string
          enrollment_id?: number
          grade_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string
          enrollment_id?: number
          grade_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_enrollments_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          created_at: string
          curriculum_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          grade_id: string | null
          id: string
          max_uses: number | null
          role: Database["public"]["Enums"]["user_space_role"]
          space_id: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          grade_id?: string | null
          id?: string
          max_uses?: number | null
          role?: Database["public"]["Enums"]["user_space_role"]
          space_id: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          grade_id?: string | null
          id?: string
          max_uses?: number | null
          role?: Database["public"]["Enums"]["user_space_role"]
          space_id?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invitation_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_codes_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_codes_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_objectives: {
        Row: {
          created_at: string
          description: string
          id: string
          sequence: number
          topic_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          sequence?: number
          topic_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          sequence?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_objectives_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_deletions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          lesson_id: string
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_deletions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_deletions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_deletions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_pages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          lesson_id: string
          sequence: number
          title: string
          video_url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          sequence?: number
          title: string
          video_url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          sequence?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_pages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          lesson_id: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          lesson_id: string
          resource_id: string
        }
        Update: {
          created_at?: string
          lesson_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          delivery_type: Database["public"]["Enums"]["lesson_delivery_type"]
          estimated_duration_minutes: number | null
          id: string
          is_published: boolean | null
          published_at: string | null
          teacher_id: string | null
          title: string
          topic_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          delivery_type?: Database["public"]["Enums"]["lesson_delivery_type"]
          estimated_duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          teacher_id?: string | null
          title: string
          topic_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          delivery_type?: Database["public"]["Enums"]["lesson_delivery_type"]
          estimated_duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          teacher_id?: string | null
          title?: string
          topic_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      node_types: {
        Row: {
          category: string
          type_id: number
          type_name: string
        }
        Insert: {
          category: string
          type_id?: number
          type_name: string
        }
        Update: {
          category?: string
          type_id?: number
          type_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          can_approve_ecosystem_admins: boolean
          created_at: string
          display_name: string
          ecosystem_type: Database["public"]["Enums"]["ecosystem_type"] | null
          id: string
          must_change_password: boolean
          role: Database["public"]["Enums"]["profile_role"]
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          can_approve_ecosystem_admins?: boolean
          created_at?: string
          display_name?: string
          ecosystem_type?: Database["public"]["Enums"]["ecosystem_type"] | null
          id: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["profile_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          can_approve_ecosystem_admins?: boolean
          created_at?: string
          display_name?: string
          ecosystem_type?: Database["public"]["Enums"]["ecosystem_type"] | null
          id?: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["profile_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          title: string
          unit_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          id: string
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          type?: Database["public"]["Enums"]["resource_type"]
          url?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          url?: string
        }
        Relationships: []
      }
      scheduled_sessions: {
        Row: {
          created_at: string
          handout_notes_url: string | null
          id: string
          lesson_id: string
          location_room: string | null
          medium: Database["public"]["Enums"]["session_medium_type"]
          meeting_url: string | null
          recording_url: string | null
          scheduled_end: string
          scheduled_start: string
          session_status: string | null
        }
        Insert: {
          created_at?: string
          handout_notes_url?: string | null
          id?: string
          lesson_id: string
          location_room?: string | null
          medium?: Database["public"]["Enums"]["session_medium_type"]
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_end: string
          scheduled_start: string
          session_status?: string | null
        }
        Update: {
          created_at?: string
          handout_notes_url?: string | null
          id?: string
          lesson_id?: string
          location_room?: string | null
          medium?: Database["public"]["Enums"]["session_medium_type"]
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_end?: string
          scheduled_start?: string
          session_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      space_edits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          changes: Json
          created_at: string
          edited_by: string
          id: string
          space_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          changes?: Json
          created_at?: string
          edited_by: string
          id?: string
          space_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          changes?: Json
          created_at?: string
          edited_by?: string
          id?: string
          space_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_edits_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_edits_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_edits_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_memberships: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["user_space_role"]
          space_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role: Database["public"]["Enums"]["user_space_role"]
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["user_space_role"]
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_memberships_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ecosystem_id: string
          id: string
          is_private: boolean
          name: string
          slug: string | null
          type: Database["public"]["Enums"]["space_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ecosystem_id: string
          id?: string
          is_private?: boolean
          name: string
          slug?: string | null
          type?: Database["public"]["Enums"]["space_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ecosystem_id?: string
          id?: string
          is_private?: boolean
          name?: string
          slug?: string | null
          type?: Database["public"]["Enums"]["space_type"]
        }
        Relationships: [
          {
            foreignKeyName: "spaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_ecosystem_id_fkey"
            columns: ["ecosystem_id"]
            isOneToOne: false
            referencedRelation: "ecosystems"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          progress_pct: number | null
          started_at: string | null
          status: string
          topic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_pct?: number | null
          started_at?: string | null
          status?: string
          topic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_pct?: number | null
          started_at?: string | null
          status?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          grade_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          grade_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          grade_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabi: {
        Row: {
          classroom_expectations: string | null
          created_at: string
          curriculum_id: string
          grading_policy: Json
          id: string
          instructor_notes: string | null
          office_hours: string | null
          required_materials: string | null
          teacher_id: string | null
        }
        Insert: {
          classroom_expectations?: string | null
          created_at?: string
          curriculum_id: string
          grading_policy: Json
          id?: string
          instructor_notes?: string | null
          office_hours?: string | null
          required_materials?: string | null
          teacher_id?: string | null
        }
        Update: {
          classroom_expectations?: string | null
          created_at?: string
          curriculum_id?: string
          grading_policy?: Json
          id?: string
          instructor_notes?: string | null
          office_hours?: string | null
          required_materials?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabi_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: true
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_guidance: {
        Row: {
          created_at: string
          guidance: string
          id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          guidance: string
          id?: string
          topic_id: string
        }
        Update: {
          created_at?: string
          guidance?: string
          id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_guidance_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          grade_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          grade_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          grade_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          duration_weeks: number | null
          id: string
          linked_goal_id: string | null
          name: string
          sequence_order: number
          subject_id: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          linked_goal_id?: string | null
          name: string
          sequence_order?: number
          subject_id?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_weeks?: number | null
          id?: string
          linked_goal_id?: string | null
          name?: string
          sequence_order?: number
          subject_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "curriculum_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          name: string
          term_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          term_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_assignments: {
        Row: {
          assignment_id: number
          created_at: string
          curriculum_node_id: number | null
          ecosystem_node_id: number | null
          role_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          assignment_id?: number
          created_at?: string
          curriculum_node_id?: number | null
          ecosystem_node_id?: number | null
          role_type: string
          status?: string
          user_id?: string | null
        }
        Update: {
          assignment_id?: number
          created_at?: string
          curriculum_node_id?: number | null
          ecosystem_node_id?: number | null
          role_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universal_assignments_curriculum_node_id_fkey"
            columns: ["curriculum_node_id"]
            isOneToOne: false
            referencedRelation: "curriculum_nodes"
            referencedColumns: ["curriculum_node_id"]
          },
          {
            foreignKeyName: "universal_assignments_ecosystem_node_id_fkey"
            columns: ["ecosystem_node_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_nodes"
            referencedColumns: ["node_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_user: {
        Args: {
          p_ecosystem_id?: string
          p_ecosystem_type?: Database["public"]["Enums"]["ecosystem_type"]
          p_email: string
          p_full_name?: string
          p_role: Database["public"]["Enums"]["profile_role"]
          p_status?: Database["public"]["Enums"]["profile_status"]
          p_temp_password: string
        }
        Returns: string
      }
      can_access_curriculum: {
        Args: { p_curriculum_id: string }
        Returns: boolean
      }
      can_edit_curriculum: {
        Args: { p_curriculum_id: string }
        Returns: boolean
      }
      can_view_ecosystem: { Args: { p_ecosystem_id: string }; Returns: boolean }
      can_view_space: { Args: { p_space_id: string }; Returns: boolean }
      grade_curriculum: { Args: { p_grade_id: string }; Returns: string }
      invitation_code_info: {
        Args: { p_code: string }
        Returns: {
          code_valid: boolean
          ecosystem_name: string
          expires_at: string
          grade_id: string
          grade_name: string
          max_uses: number
          role: string
          space_id: string
          space_name: string
          used_count: number
        }[]
      }
      is_ecosystem_admin_for_space: {
        Args: { p_space_id: string }
        Returns: boolean
      }
      is_effective_space_admin: {
        Args: { p_space_id: string }
        Returns: boolean
      }
      is_effective_space_staff: {
        Args: { p_space_id: string }
        Returns: boolean
      }
      is_effective_staff_anywhere: { Args: never; Returns: boolean }
      lesson_curriculum: { Args: { p_lesson_id: string }; Returns: string }
      lesson_space: { Args: { p_lesson_id: string }; Returns: string }
      term_curriculum: { Args: { p_term_id: string }; Returns: string }
      topic_curriculum: { Args: { p_topic_id: string }; Returns: string }
      unit_curriculum: { Args: { p_unit_id: string }; Returns: string }
    }
    Enums: {
      assessment_type: "quiz" | "exercise" | "test" | "project"
      ecosystem_staff_role: "ecosystem_admin" | "space_admin"
      ecosystem_type:
        | "primary_school"
        | "university"
        | "organization"
        | "macro_alliance"
        | "nursery_school"
        | "secondary_school"
      lesson_delivery_type: "self_paced" | "scheduled"
      profile_role:
        | "program_admin"
        | "ecosystem_admin"
        | "space_admin"
        | "member"
        | "super_admin"
      profile_status: "pending" | "approved" | "rejected"
      resource_type: "link" | "video" | "document" | "text"
      session_medium_type: "online" | "physical"
      space_type: "department" | "innovation_hub" | "project_group"
      user_space_role:
        | "teacher"
        | "learner"
        | "mentor"
        | "collaborator"
        | "admin"
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
      assessment_type: ["quiz", "exercise", "test", "project"],
      ecosystem_staff_role: ["ecosystem_admin", "space_admin"],
      ecosystem_type: [
        "primary_school",
        "university",
        "organization",
        "macro_alliance",
        "nursery_school",
        "secondary_school",
      ],
      lesson_delivery_type: ["self_paced", "scheduled"],
      profile_role: [
        "program_admin",
        "ecosystem_admin",
        "space_admin",
        "member",
        "super_admin",
      ],
      profile_status: ["pending", "approved", "rejected"],
      resource_type: ["link", "video", "document", "text"],
      session_medium_type: ["online", "physical"],
      space_type: ["department", "innovation_hub", "project_group"],
      user_space_role: [
        "teacher",
        "learner",
        "mentor",
        "collaborator",
        "admin",
      ],
    },
  },
} as const

