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
          created_at: string;
          credits: number;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          credits?: number;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          credits?: number;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_history: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          credits: number;
          status: string;
          package_name: string | null;
          stripe_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          credits: number;
          status?: string;
          package_name?: string | null;
          stripe_session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          credits?: number;
          status?: string;
          package_name?: string | null;
          stripe_session_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sketches: {
        Row: {
          animated_image_url: string | null;
          content_type: string;
          created_at: string;
          fal_request_id: string | null;
          id: string;
          is_new: boolean;
          name: string;
          original_image_url: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          video_prompt: string | null;
        };
        Insert: {
          animated_image_url?: string | null;
          content_type?: string;
          created_at?: string;
          fal_request_id?: string | null;
          id?: string;
          is_new?: boolean;
          name: string;
          original_image_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          video_prompt?: string | null;
        };
        Update: {
          animated_image_url?: string | null;
          content_type?: string;
          created_at?: string;
          fal_request_id?: string | null;
          id?: string;
          is_new?: boolean;
          name?: string;
          original_image_url?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          video_prompt?: string | null;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          sketch_id: string;
          theme: string;
          status: string;
          page_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sketch_id: string;
          theme: string;
          status?: string;
          page_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sketch_id?: string;
          theme?: string;
          status?: string;
          page_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stories_sketch_id_fkey";
            columns: ["sketch_id"];
            referencedRelation: "sketches";
            referencedColumns: ["id"];
          }
        ];
      };
      story_pages: {
        Row: {
          id: string;
          story_id: string;
          page_number: number;
          text: string;
          illustration_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          page_number: number;
          text: string;
          illustration_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          page_number?: number;
          text?: string;
          illustration_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_pages_story_id_fkey";
            columns: ["story_id"];
            referencedRelation: "stories";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      deduct_user_credit: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      get_user_credits: {
        Args: { user_uuid: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Story = Database["public"]["Tables"]["stories"]["Row"];
export type StoryPage = Database["public"]["Tables"]["story_pages"]["Row"];
export type StoryInsert = Database["public"]["Tables"]["stories"]["Insert"];
export type StoryPageInsert = Database["public"]["Tables"]["story_pages"]["Insert"];

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
