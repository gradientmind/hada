export type UserTier = "free" | "paid" | "pro";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  tier: UserTier;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: "google" | "microsoft";
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string[];
  created_at: string;
  updated_at: string;
}

// Database schema for Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Conversation, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: Partial<Omit<Message, "id" | "created_at">>;
      };
      integrations: {
        Row: Integration;
        Insert: Omit<Integration, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Integration, "id" | "created_at">>;
      };
    };
  };
};
