export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          industry: string
          size: string
          keywords: string[]
          region: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          industry: string
          size: string
          keywords?: string[]
          region?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          industry?: string
          size?: string
          keywords?: string[]
          region?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      licitaciones: {
        Row: {
          id: string
          nombre: string
          estado: string
          descripcion: string | null
          fecha_cierre: string | null
          fecha_publicacion: string | null
          monto_estimado: number | null
          moneda: string
          organismo: string | null
          region: string | null
          raw_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nombre: string
          estado: string
          descripcion?: string | null
          fecha_cierre?: string | null
          fecha_publicacion?: string | null
          monto_estimado?: number | null
          moneda?: string
          organismo?: string | null
          region?: string | null
          raw_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          estado?: string
          descripcion?: string | null
          fecha_cierre?: string | null
          fecha_publicacion?: string | null
          monto_estimado?: number | null
          moneda?: string
          organismo?: string | null
          region?: string | null
          raw_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      company_licitacion_matches: {
        Row: {
          id: string
          company_id: string
          licitacion_id: string
          score: number
          recommendation_level: string
          insights: string | null
          matched_keywords: string[]
          is_saved: boolean
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          licitacion_id: string
          score: number
          recommendation_level: string
          insights?: string | null
          matched_keywords?: string[]
          is_saved?: boolean
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          licitacion_id?: string
          score?: number
          recommendation_level?: string
          insights?: string | null
          matched_keywords?: string[]
          is_saved?: boolean
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
