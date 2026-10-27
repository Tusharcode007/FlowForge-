export type ProjectStatus = 'active' | 'on_hold' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export interface Project {
  id: string; owner_id: string; name: string; description: string | null
  status: ProjectStatus; target_date: string | null; created_at: string; updated_at: string
}
export interface Task {
  id: string; project_id: string; owner_id: string; title: string; description: string | null
  status: TaskStatus; priority: Priority; due_date: string | null; created_at: string; updated_at: string
}
export type ProjectInput = Pick<Project, 'name' | 'description' | 'status' | 'target_date'>
export type TaskInput = Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date'>
