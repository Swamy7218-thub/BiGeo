// Auto-generated from the Supabase project schema (supabase/migrations).
// Regenerate with: Supabase MCP `generate_typescript_types`, or
// `supabase gen types typescript --project-id <ref>` if you have the CLI linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_date: string | null
          bill_number: string | null
          company_id: string
          created_at: string
          file_hash: string | null
          id: string
          processing_error: string | null
          raw_file_url: string
          status: string
          total_approved: number
          total_claimed: number
          total_flagged: number
          transporter_id: string
        }
        Insert: {
          bill_date?: string | null
          bill_number?: string | null
          company_id: string
          created_at?: string
          file_hash?: string | null
          id?: string
          processing_error?: string | null
          raw_file_url: string
          status?: string
          total_approved?: number
          total_claimed?: number
          total_flagged?: number
          transporter_id: string
        }
        Update: {
          bill_date?: string | null
          bill_number?: string | null
          company_id?: string
          created_at?: string
          file_hash?: string | null
          id?: string
          processing_error?: string | null
          raw_file_url?: string
          status?: string
          total_approved?: number
          total_claimed?: number
          total_flagged?: number
          transporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "transporters"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          pilot_started_at: string
          plan: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pilot_started_at?: string
          plan?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pilot_started_at?: string
          plan?: string
        }
        Relationships: []
      }
      flags: {
        Row: {
          claimed_amount: number | null
          created_at: string
          expected_amount: number | null
          flag_type: string
          id: string
          reason: string
          related_bill_id: string | null
          status: string
          trip_line_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          claimed_amount?: number | null
          created_at?: string
          expected_amount?: number | null
          flag_type: string
          id?: string
          reason?: string
          related_bill_id?: string | null
          status?: string
          trip_line_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          claimed_amount?: number | null
          created_at?: string
          expected_amount?: number | null
          flag_type?: string
          id?: string
          reason?: string
          related_bill_id?: string | null
          status?: string
          trip_line_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flags_related_bill_id_fkey"
            columns: ["related_bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_trip_line_id_fkey"
            columns: ["trip_line_id"]
            isOneToOne: false
            referencedRelation: "trip_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pods: {
        Row: {
          company_id: string
          created_at: string
          extracted_lr_number: string | null
          file_url: string
          id: string
          matched_by: string | null
          pod_date: string | null
          trip_line_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          extracted_lr_number?: string | null
          file_url: string
          id?: string
          matched_by?: string | null
          pod_date?: string | null
          trip_line_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          extracted_lr_number?: string | null
          file_url?: string
          id?: string
          matched_by?: string | null
          pod_date?: string | null
          trip_line_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pods_trip_line_id_fkey"
            columns: ["trip_line_id"]
            isOneToOne: false
            referencedRelation: "trip_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_contracts: {
        Row: {
          company_id: string
          created_at: string
          extraction_confidence: number | null
          id: string
          parsed_json: Json | null
          raw_file_url: string
          status: string
          transporter_id: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          extraction_confidence?: number | null
          id?: string
          parsed_json?: Json | null
          raw_file_url: string
          status?: string
          transporter_id: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          extraction_confidence?: number | null
          id?: string
          parsed_json?: Json | null
          raw_file_url?: string
          status?: string
          transporter_id?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_contracts_transporter_id_fkey"
            columns: ["transporter_id"]
            isOneToOne: false
            referencedRelation: "transporters"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_lines: {
        Row: {
          contract_id: string
          destination: string
          detention_free_days: number
          detention_rate: number
          id: string
          origin: string
          rate: number
          rate_basis: string
          vehicle_type: string
        }
        Insert: {
          contract_id: string
          destination: string
          detention_free_days?: number
          detention_rate?: number
          id?: string
          origin: string
          rate: number
          rate_basis: string
          vehicle_type: string
        }
        Update: {
          contract_id?: string
          destination?: string
          detention_free_days?: number
          detention_rate?: number
          id?: string
          origin?: string
          rate?: number
          rate_basis?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_lines_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rate_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      transporters: {
        Row: {
          company_id: string
          created_at: string
          gstin: string | null
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          gstin?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          gstin?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "transporters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_lines: {
        Row: {
          base_amount: number
          bill_id: string
          created_at: string
          destination: string | null
          extra_charges_json: Json
          extraction_confidence: number
          id: string
          lr_number: string | null
          needs_review: boolean
          origin: string | null
          trip_date: string | null
          vehicle_number: string | null
          vehicle_type: string | null
        }
        Insert: {
          base_amount?: number
          bill_id: string
          created_at?: string
          destination?: string | null
          extra_charges_json?: Json
          extraction_confidence?: number
          id?: string
          lr_number?: string | null
          needs_review?: boolean
          origin?: string | null
          trip_date?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Update: {
          base_amount?: number
          bill_id?: string
          created_at?: string
          destination?: string | null
          extra_charges_json?: Json
          extraction_confidence?: number
          id?: string
          lr_number?: string | null
          needs_review?: boolean
          origin?: string | null
          trip_date?: string | null
          vehicle_number?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_lines_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id: string
          role?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
