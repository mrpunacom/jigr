// Location Count Session Types

export type SessionStatus = 'active' | 'paused' | 'completed'

export interface LocationCountSession {
  id: string
  client_id: string
  location_id: string
  user_id: string
  session_status: SessionStatus
  started_at: string
  paused_at?: string
  completed_at?: string
  total_items_count: number
  counted_items_count: number
  location_name: string
  progress_percentage: number
}

export interface SessionItemCount {
  id: string
  session_id: string
  item_id: string
  item_name: string
  quantity_on_hand: number
  count_unit: string
  notes?: string
  counted_at: string
  is_counted: boolean
}

export interface LocationCountProgress {
  session: LocationCountSession
  itemCounts: SessionItemCount[]
  pendingItems: InventoryItem[]
  completedItems: SessionItemCount[]
}

export interface CreateSessionRequest {
  location_id: string
  user_id: string
  client_id: string
}

export interface SessionAction {
  type: 'CREATE_SESSION' | 'PAUSE_SESSION' | 'RESUME_SESSION' | 'COMMIT_SESSION' | 'UPDATE_ITEM_COUNT'
  payload: any
}

// Extended types for existing inventory items
export interface InventoryItem {
  id: string
  item_name: string
  brand?: string
  count_unit: string
  par_level_low?: number
  par_level_high?: number
  unit_cost?: number
  category_id?: string
  category_name?: string
  is_active: boolean
  client_id: string
  created_at: string
  updated_at: string
}