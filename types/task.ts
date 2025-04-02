export type TaskStatus =
  | "prioritized"
  | "critical"
  | "priority-change"
  | "impacted"
  | "external-dev"
  | "in-development"
  | "planned"
  | "blocked"
  | "completed"

export interface Task {
  id: string
  name: string
  start_date: Date
  end_date: Date
  status: TaskStatus
  completed: boolean
  details?: string
  responsible?: string
  created_at?: Date
  updated_at?: Date
}

export interface TaskInput {
  name: string
  start_date: Date
  end_date: Date
  status: TaskStatus
  completed?: boolean
  details?: string
  responsible?: string
}

