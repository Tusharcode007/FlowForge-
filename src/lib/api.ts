import type { Project, ProjectInput, Task, TaskInput } from '../types'
import { supabase } from './supabase'

function client() { if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.') ; return supabase }
async function unwrap<T>(request: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await request
  if (error) throw new Error(error.message)
  return data as T
}
export const api = {
  projects: () => unwrap<Project[]>(client().from('projects').select('*').order('updated_at', { ascending: false })),
  createProject: (input: ProjectInput) => unwrap<Project>(client().from('projects').insert(input).select().single()),
  updateProject: (id: string, input: Partial<ProjectInput>) => unwrap<Project>(client().from('projects').update(input).eq('id', id).select().single()),
  deleteProject: (id: string) => unwrap<null>(client().from('projects').delete().eq('id', id).select().single()),
  tasks: (projectId?: string) => unwrap<Task[]>(projectId ? client().from('tasks').select('*').eq('project_id', projectId).order('created_at') : client().from('tasks').select('*').order('created_at')),
  createTask: (projectId: string, input: TaskInput) => unwrap<Task>(client().from('tasks').insert({ ...input, project_id: projectId }).select().single()),
  updateTask: (id: string, input: Partial<TaskInput>) => unwrap<Task>(client().from('tasks').update(input).eq('id', id).select().single()),
  deleteTask: (id: string) => unwrap<null>(client().from('tasks').delete().eq('id', id).select().single()),
}
