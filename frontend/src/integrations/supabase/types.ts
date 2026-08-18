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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_credentials: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          role: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          role?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          role?: string | null
          username?: string
        }
        Relationships: []
      }
      feed_posts: {
        Row: {
          id: string
          person_id: string
          content: string
          image_url: string | null
          is_birthday_post: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          person_id: string
          content: string
          image_url?: string | null
          is_birthday_post?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          person_id?: string
          content?: string
          image_url?: string | null
          is_birthday_post?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      feed_likes: {
        Row: {
          id: string
          post_id: string
          person_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          person_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          person_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          id: string
          post_id: string
          person_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          person_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          person_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      children: {
        Row: {
          child_birthday: string | null
          child_name: string
          created_at: string | null
          id: string
          person_id: string
        }
        Insert: {
          child_birthday?: string | null
          child_name: string
          created_at?: string | null
          id?: string
          person_id: string
        }
        Update: {
          child_birthday?: string | null
          child_name?: string
          created_at?: string | null
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["uuid"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          is_active: boolean | null
          location: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      homepage_images: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_images_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      media_gallery: {
        Row: {
          created_at: string | null
          description: string | null
          file_type: string
          file_url: string
          folder_id: string | null
          id: string
          organization: string
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_type: string
          file_url: string
          folder_id?: string | null
          id?: string
          organization: string
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_type?: string
          file_url?: string
          folder_id?: string | null
          id?: string
          organization?: string
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_gallery_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "gallery_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          date_of_marriage: string | null
          educational_background: string | null
          email: string
          father_birthday: string | null
          father_name: string | null
          first_name: string
          full_name: string
          gender: string | null
          last_name: string
          marital_status: string | null
          middle_name: string | null
          mother_birthday: string | null
          mother_name: string | null
          occupation: string | null
          organization: string | null
          phone: string | null
          profile_picture: string | null
          spouse_name: string | null
          suffix: string | null
          uuid: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          date_of_marriage?: string | null
          educational_background?: string | null
          email: string
          father_birthday?: string | null
          father_name?: string | null
          first_name: string
          full_name: string
          gender?: string | null
          last_name: string
          marital_status?: string | null
          middle_name?: string | null
          mother_birthday?: string | null
          mother_name?: string | null
          occupation?: string | null
          organization?: string | null
          phone?: string | null
          profile_picture?: string | null
          spouse_name?: string | null
          suffix?: string | null
          uuid?: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          date_of_marriage?: string | null
          educational_background?: string | null
          email?: string
          father_birthday?: string | null
          father_name?: string | null
          first_name?: string
          full_name?: string
          gender?: string | null
          last_name?: string
          marital_status?: string | null
          middle_name?: string | null
          mother_birthday?: string | null
          mother_name?: string | null
          occupation?: string | null
          organization?: string | null
          phone?: string | null
          profile_picture?: string | null
          spouse_name?: string | null
          suffix?: string | null
          uuid?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          created_at: string | null
          id: string
          is_answered: boolean | null
          is_public: boolean | null
          person_id: string | null
          request: string
          requester_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_public?: boolean | null
          person_id?: string | null
          request: string
          requester_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_public?: boolean | null
          person_id?: string | null
          request?: string
          requester_name?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          person_id: string | null
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          person_id?: string | null
          sender_name?: string | null
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          person_id?: string | null
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string | null
          created_at: string | null
          full_name: string | null
          id: string
          person_id: string | null
          username: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          person_id?: string | null
          username?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          person_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_auth: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          password_plain: string | null
          person_id: string
          username: string | null
          username_changed: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          password_plain?: string | null
          person_id: string
          username?: string | null
          username_changed?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          password_plain?: string | null
          person_id?: string
          username?: string | null
          username_changed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_auth_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["uuid"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          person_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          person_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          person_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["uuid"]
          },
        ]
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          type: string
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          type: string
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          type?: string
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_auth"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_member: {
        Args: { p_admin_token: string; p_member_uuid: string }
        Returns: boolean
      }
      admin_update_member: {
        Args: { p_admin_token: string; p_member_uuid: string; p_updates: Json }
        Returns: boolean
      }
      change_admin_password: {
        Args: {
          p_admin_id: string
          p_new_password: string
          p_old_password: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      change_user_username: {
        Args: {
          p_current_password: string
          p_new_username: string
          p_person_id: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_expired_verification_codes: { Args: never; Returns: undefined }
      create_admin_user: {
        Args: { p_password: string; p_username: string }
        Returns: string
      }
      create_sub_admin: {
        Args: { p_password: string; p_role: string; p_username: string }
        Returns: string
      }
      create_user_auth: {
        Args: {
          p_email: string
          p_password: string
          p_person_id: string
          p_username: string
        }
        Returns: string
      }
      get_member_credentials: {
        Args: { p_admin_token: string; p_person_id: string }
        Returns: {
          password_display: string
          username: string
        }[]
      }
      get_upcoming_birthdays: {
        Args: never
        Returns: {
          birthday_date: string
          days_until: number
          person_name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      update_user_password: {
        Args: { p_email: string; p_password: string }
        Returns: undefined
      }
      verify_admin_credentials: {
        Args: { p_password: string; p_username: string }
        Returns: {
          admin_id: string
          is_valid: boolean
          role: string
        }[]
      }
      verify_admin_session: {
        Args: { p_token: string }
        Returns: {
          admin_id: string
          is_valid: boolean
          role: string
        }[]
      }
      verify_user_credentials: {
        Args: { p_password: string; p_username: string }
        Returns: {
          is_valid: boolean
          person_id: string
        }[]
      }
      verify_user_session: {
        Args: { p_token: string }
        Returns: {
          is_valid: boolean
          person_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const