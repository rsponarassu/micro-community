// Placeholder — replace with output of: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
// Run after completing Milestone 2 database setup.

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
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: string | null
          icon_url: string | null
          cover_url: string | null
          is_private: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category?: string | null
          icon_url?: string | null
          cover_url?: string | null
          is_private?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string | null
          icon_url?: string | null
          cover_url?: string | null
          is_private?: boolean
          created_by?: string
          created_at?: string
        }
      }
      community_members: {
        Row: {
          community_id: string
          user_id: string
          role: 'owner' | 'moderator' | 'member'
          status: 'active' | 'pending' | 'banned'
          joined_at: string
        }
        Insert: {
          community_id: string
          user_id: string
          role?: 'owner' | 'moderator' | 'member'
          status?: 'active' | 'pending' | 'banned'
          joined_at?: string
        }
        Update: {
          community_id?: string
          user_id?: string
          role?: 'owner' | 'moderator' | 'member'
          status?: 'active' | 'pending' | 'banned'
          joined_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          community_id: string
          user_id: string
          content: string
          image_url: string | null
          is_anonymous: boolean
          is_pinned: boolean
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          content: string
          image_url?: string | null
          is_anonymous?: boolean
          is_pinned?: boolean
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          content?: string
          image_url?: string | null
          is_anonymous?: boolean
          is_pinned?: boolean
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          parent_id: string | null
          user_id: string
          content: string
          is_anonymous: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          parent_id?: string | null
          user_id: string
          content: string
          is_anonymous?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          parent_id?: string | null
          user_id?: string
          content?: string
          is_anonymous?: boolean
          created_at?: string
        }
      }
      reactions: {
        Row: {
          post_id: string
          user_id: string
          type: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          type: string
          created_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          type?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          community_id: string
          created_by: string
          title: string
          description: string | null
          location: string | null
          online_url: string | null
          starts_at: string
          ends_at: string | null
          capacity: number | null
          cover_url: string | null
          is_cancelled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          created_by: string
          title: string
          description?: string | null
          location?: string | null
          online_url?: string | null
          starts_at: string
          ends_at?: string | null
          capacity?: number | null
          cover_url?: string | null
          is_cancelled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          created_by?: string
          title?: string
          description?: string | null
          location?: string | null
          online_url?: string | null
          starts_at?: string
          ends_at?: string | null
          capacity?: number | null
          cover_url?: string | null
          is_cancelled?: boolean
          created_at?: string
        }
      }
      event_rsvps: {
        Row: {
          event_id: string
          user_id: string
          status: 'going' | 'interested' | 'not_going'
          created_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          status: 'going' | 'interested' | 'not_going'
          created_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          status?: 'going' | 'interested' | 'not_going'
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          payload: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          payload?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          payload?: Json
          is_read?: boolean
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: string
          target_id: string
          community_id: string | null
          reason: string
          status: 'open' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: string
          target_id: string
          community_id?: string | null
          reason: string
          status?: 'open' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_type?: string
          target_id?: string
          community_id?: string | null
          reason?: string
          status?: 'open' | 'resolved' | 'dismissed'
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string
          action: string
          target: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          action: string
          target?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          action?: string
          target?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      posts_public: {
        Row: {
          id: string
          community_id: string
          content: string
          image_url: string | null
          is_anonymous: boolean
          is_pinned: boolean
          is_hidden: boolean
          created_at: string
          updated_at: string
          author_id: string | null
          author_username: string | null
          author_display_name: string | null
          author_avatar_url: string | null
        }
      }
      comments_public: {
        Row: {
          id: string
          post_id: string
          parent_id: string | null
          content: string
          is_anonymous: boolean
          created_at: string
          author_id: string | null
          author_username: string | null
          author_display_name: string | null
          author_avatar_url: string | null
        }
      }
    }
    Functions: {
      is_member: {
        Args: { community_id: string }
        Returns: boolean
      }
      is_mod_or_owner: {
        Args: { community_id: string }
        Returns: boolean
      }
      delete_own_post: {
        Args: { post_id: string }
        Returns: void
      }
      toggle_reaction: {
        Args: { p_post_id: string; p_type: string }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
