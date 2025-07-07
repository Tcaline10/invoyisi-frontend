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
      clients: {
        Row: {
          id: number
          name: string
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          user_id: string
          created_at: string
          updated_at: string | null
          company_name: string | null
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          user_id: string
          created_at?: string
          updated_at?: string | null
          company_name?: string | null
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string | null
          company_name?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          number: string
          status: string
          issued_date: string
          due_date: string
          subtotal: number
          tax: number
          discount: number
          total: number
          notes: string | null
          client_id: number
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          number: string
          status: string
          issued_date: string
          due_date: string
          subtotal: number
          tax: number
          discount?: number
          total: number
          notes?: string | null
          client_id: number
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          number?: string
          status?: string
          issued_date?: string
          due_date?: string
          subtotal?: number
          tax?: number
          discount?: number
          total?: number
          notes?: string | null
          client_id?: number
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          amount: number
          date: string
          method: string
          reference: string | null
          notes: string | null
          invoice_id: string
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          amount: number
          date: string
          method: string
          reference?: string | null
          notes?: string | null
          invoice_id: string
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          amount?: number
          date?: string
          method?: string
          reference?: string | null
          notes?: string | null
          invoice_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}
