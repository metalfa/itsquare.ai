// ITSquare.AI Database Types
// Auto-generated based on database schema

export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'enterprise'
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed'
export type IntegrationProvider = 'okta' | 'google_workspace'
export type IntegrationStatus = 'active' | 'disconnected' | 'error'
export type FindingCategory = 'dormant_account' | 'no_mfa' | 'over_privileged' | 'shared_account' | 'external_account' | 'unused_license'
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type RemediationStatus = 'open' | 'in_progress' | 'resolved' | 'ignored'
export type UserRole = 'admin' | 'viewer'
export type TriggerType = 'manual' | 'scheduled' | 'api'
export type ScanEventType = 'started' | 'progress' | 'completed' | 'failed' | 'finding_detected'

export interface Organization {
  id: string
  name: string
  industry: string | null
  employee_count_range: string | null
  subscription_tier: SubscriptionTier
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  org_id: string | null
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  org_id: string
  provider: IntegrationProvider
  access_token_encrypted: string
  refresh_token_encrypted: string | null
  token_expires_at: string | null
  domain: string | null
  scopes: string[] | null
  status: IntegrationStatus
  last_sync_at: string | null
  connected_at: string
  created_at: string
  updated_at: string
}

export interface Scan {
  id: string
  org_id: string
  status: ScanStatus
  triggered_by: string | null
  trigger_type: TriggerType
  total_users: number
  dormant_accounts: number
  no_mfa_accounts: number
  over_privileged_accounts: number
  shared_accounts: number
  external_accounts: number
  unused_licenses: number
  overall_score: number | null
  access_hygiene_score: number | null
  mfa_coverage_score: number | null
  license_efficiency_score: number | null
  privilege_score: number | null
  benchmark_percentile: number | null
  industry_benchmark_percentile: number | null
  ai_summary: string | null
  ai_recommendations: AIRecommendation[] | null
  report_pdf_url: string | null
  error_message: string | null
  error_code: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AIRecommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: FindingCategory
  estimated_impact: string
}

export interface Finding {
  id: string
  scan_id: string
  category: FindingCategory
  severity: FindingSeverity
  user_email: string | null
  user_name: string | null
  detail: Record<string, unknown> | null
  source: IntegrationProvider
  remediation_status: RemediationStatus
  remediated_at: string | null
  remediated_by: string | null
  created_at: string
}

export interface Benchmark {
  id: string
  industry: string | null
  employee_count_range: string | null
  metric: string
  value: number
  scan_id: string | null
  created_at: string
}

export interface ScanEvent {
  id: string
  scan_id: string
  event_type: ScanEventType
  message: string | null
  progress_percent: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// Database table types for Supabase client
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'> & { 
          id?: string
          created_at?: string
          updated_at?: string 
        }
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      integrations: {
        Row: Integration
        Insert: Omit<Integration, 'id' | 'created_at' | 'updated_at' | 'connected_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
          connected_at?: string
        }
        Update: Partial<Omit<Integration, 'id' | 'created_at' | 'connected_at'>>
      }
      scans: {
        Row: Scan
        Insert: Omit<Scan, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Scan, 'id' | 'created_at'>>
      }
      findings: {
        Row: Finding
        Insert: Omit<Finding, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Finding, 'id' | 'scan_id' | 'created_at'>>
      }
      benchmarks: {
        Row: Benchmark
        Insert: Omit<Benchmark, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Benchmark, 'id' | 'created_at'>>
      }
      scan_events: {
        Row: ScanEvent
        Insert: Omit<ScanEvent, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: never // Events are immutable
      }
    }
  }
}
