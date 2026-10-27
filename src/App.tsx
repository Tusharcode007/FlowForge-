import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api } from './lib/api'
import { isConfigured, supabase } from './lib/supabase'
import type { Priority, Project, ProjectInput, ProjectStatus, Task, TaskInput, TaskStatus } from './types'

const blankProject: ProjectInput = { name: '', description: '', status: 'active', target_date: null }
const blankTask: TaskInput = { title: '', description: '', status: 'todo', priority: 'medium', due_date: null }
const statusLabel = (value: string) => value.replace('_', ' ')
const dateValue = (date: string | null) => date ?? ''
const isOverdue = (task: Task) => Boolean(task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().slice(0, 10))
const openDialog = (id: string) => (document.getElementById(id) as HTMLDialogElement | null)?.showModal()

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [authMode, setAuthMode] = useState<'sign_in' | 'sign_up'>('sign_in')

  const activeProject = projects.find((project) => project.id === activeId) ?? null
  const activeTasks = activeId ? tasks.filter((task) => task.project_id === activeId) : tasks
  const completed = tasks.filter((task) => task.status === 'done').length
  const overdue = tasks.filter(isOverdue).length

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session) void refresh() }, [session])

  async function refresh() {
    setLoading(true); setError('')
    try { const [nextProjects, nextTasks] = await Promise.all([api.projects(), api.tasks()]); setProjects(nextProjects); setTasks(nextTasks) }
    catch (err) { setError(message(err)) }
    finally { setLoading(false) }
  }
  function announce(text: string) { setNotice(text); setTimeout(() => setNotice(''), 3500) }
  async function signOut() { await supabase?.auth.signOut(); setProjects([]); setTasks([]); setActiveId(null) }

  if (!isConfigured) return <SetupScreen />
  if (!session) return <AuthScreen mode={authMode} setMode={setAuthMode} />

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">F</span><span>FlowForge</span></div>
      <button className={`nav-item ${!activeId ? 'selected' : ''}`} onClick={() => setActiveId(null)}>⌂ <span>Overview</span></button>
      <div className="sidebar-heading">PROJECTS <button aria-label="Create project" onClick={() => openDialog('project-dialog')}>+</button></div>
      <div className="project-nav">{projects.map(project => <button key={project.id} className={`nav-item ${activeId === project.id ? 'selected' : ''}`} onClick={() => setActiveId(project.id)}><i className={`dot ${project.status}`} /> <span>{project.name}</span></button>)}</div>
      <div className="sidebar-footer"><span>{session.user.email}</span><button className="text-button" onClick={signOut}>Sign out</button></div>
    </aside>
    <section className="content">
      <header className="topbar"><div><p className="eyebrow">{activeProject ? 'PROJECT SPACE' : 'EXECUTION OVERVIEW'}</p><h1>{activeProject ? activeProject.name : 'Make progress visible.'}</h1></div><button className="primary" onClick={() => openDialog(activeProject ? 'task-dialog' : 'project-dialog')}>{activeProject ? '+ Add task' : '+ New project'}</button></header>
      {error && <div className="alert error"><span>{error}</span><button onClick={() => setError('')}>×</button></div>}
      {notice && <div className="toast">{notice}</div>}
      {loading ? <div className="loading">Loading your workspace…</div> : activeProject ?
        <ProjectView project={activeProject} tasks={activeTasks} onTaskChange={refresh} onProjectChange={async () => { await refresh(); setActiveId(null) }} notify={announce} /> :
        <Dashboard projects={projects} tasks={tasks} completed={completed} overdue={overdue} onSelect={setActiveId} />}
    </section>
    <ProjectDialog onSaved={async () => { await refresh(); announce('Project saved.') }} />
    {activeProject && <TaskDialog projectId={activeProject.id} onSaved={async () => { await refresh(); announce('Task saved.') }} />}
  </main>
}

function SetupScreen() { return <div className="auth-page"><div className="setup-card"><div className="brand"><span className="brand-mark">F</span> FlowForge</div><h1>Connect your workspace</h1><p>FlowForge is ready for a Supabase project. Copy <code>.env.example</code> to <code>.env</code>, add your project URL and anonymous key, then restart the dev server.</p><p className="muted">Run the included <code>supabase/schema.sql</code> in Supabase SQL Editor before signing in.</p></div></div> }

function AuthScreen({ mode, setMode }: { mode: 'sign_in' | 'sign_up'; setMode: (mode: 'sign_in' | 'sign_up') => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); setSuccess('')
    const result = mode === 'sign_in' ? await supabase!.auth.signInWithPassword({ email, password }) : await supabase!.auth.signUp({ email, password })
    setBusy(false); if (result.error) setError(result.error.message); else if (mode === 'sign_up' && !result.data.session) setSuccess('Check your email to confirm your account, then sign in.')
  }
  return <div className="auth-page"><form className="auth-card" onSubmit={submit}><div className="brand"><span className="brand-mark">F</span> FlowForge</div><p className="eyebrow">PROJECT EXECUTION, SIMPLIFIED</p><h1>{mode === 'sign_in' ? 'Welcome back' : 'Create your workspace'}</h1><p className="muted">{mode === 'sign_in' ? 'Sign in to focus on what matters next.' : 'Start turning plans into completed work.'}</p>{error && <div className="alert error">{error}</div>}{success && <div className="alert success">{success}</div>}<label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'} /></label><button className="primary wide" disabled={busy}>{busy ? 'Working…' : mode === 'sign_in' ? 'Sign in' : 'Create account'}</button><button type="button" className="text-button center" onClick={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}>{mode === 'sign_in' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button></form></div>
}

function Dashboard({ projects, tasks, completed, overdue, onSelect }: { projects: Project[]; tasks: Task[]; completed: number; overdue: number; onSelect: (id: string) => void }) {
  const focus = tasks.filter(t => t.status !== 'done').sort((a,b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')).slice(0, 5)
  return <div className="dashboard"><div className="stats"><Stat label="Active projects" value={projects.filter(p => p.status === 'active').length} hint={`${projects.length} total`} /><Stat label="Tasks completed" value={completed} hint={`${tasks.length} total tasks`} /><Stat label="Needs attention" value={overdue} hint={overdue ? 'Overdue tasks' : 'Nothing overdue'} tone={overdue ? 'danger' : undefined} /></div><section className="panel"><div className="section-title"><div><h2>Focus next</h2><p>Open tasks, ordered by due date.</p></div></div>{focus.length ? <div className="task-list">{focus.map(task => <TaskRow key={task.id} task={task} compact />)}</div> : <Empty title="Your task list is clear" detail="Create a project, then add the work that moves it forward." />}</section><section className="panel"><div className="section-title"><div><h2>Projects</h2><p>Progress is calculated from completed tasks.</p></div></div>{projects.length ? <div className="project-grid">{projects.map(project => <ProjectCard key={project.id} project={project} tasks={tasks.filter(t => t.project_id === project.id)} onClick={() => onSelect(project.id)} />)}</div> : <Empty title="Start with a project" detail="Give your work a home, then break it into actionable tasks." />}</section></div>
}
function Stat({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: string }) { return <article className={`stat ${tone ?? ''}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article> }
function ProjectCard({ project, tasks, onClick }: { project: Project; tasks: Task[]; onClick: () => void }) { const done = tasks.filter(t => t.status === 'done').length; const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0; return <button className="project-card" onClick={onClick}><div className="card-top"><span className={`badge ${project.status}`}>{statusLabel(project.status)}</span><span>→</span></div><h3>{project.name}</h3><p>{project.description || 'No description yet.'}</p><div className="progress-label"><span>{tasks.length ? `${done} of ${tasks.length} complete` : 'No tasks yet'}</span><strong>{tasks.length ? `${progress}%` : '—'}</strong></div><div className="progress"><i style={{ width: `${progress}%` }} /></div></button> }
function ProjectView({ project, tasks, onTaskChange, onProjectChange, notify }: { project: Project; tasks: Task[]; onTaskChange: () => Promise<void>; onProjectChange: () => Promise<void>; notify: (text: string) => void }) {
  const done = tasks.filter(t => t.status === 'done').length; const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0
  return <div className="project-view"><section className="project-hero"><div><span className={`badge ${project.status}`}>{statusLabel(project.status)}</span><p>{project.description || 'No description yet.'}</p>{project.target_date && <small>Target date · {formatDate(project.target_date)}</small>}</div><div className="project-actions"><button className="secondary" onClick={() => openDialog('edit-project-dialog')}>Edit project</button><button className="danger-button" onClick={async () => { if (confirm(`Delete “${project.name}” and all its tasks?`)) { try { await api.deleteProject(project.id); notify('Project deleted.'); await onProjectChange() } catch (err) { notify(message(err)) } } }}>Delete</button></div></section><div className="progress-summary"><div><strong>{tasks.length ? `${progress}%` : '—'}</strong><span>project progress</span></div><div className="progress"><i style={{ width: `${progress}%` }} /></div><small>{tasks.length ? `${done} of ${tasks.length} tasks complete` : 'Add tasks to calculate progress.'}</small></div><section className="panel"><div className="section-title"><div><h2>Tasks</h2><p>{tasks.length ? `${tasks.filter(t => t.status === 'todo').length} to do · ${tasks.filter(t => t.status === 'in_progress').length} in progress · ${done} complete` : 'Break the project into concrete next steps.'}</p></div><button className="secondary" onClick={() => openDialog('task-dialog')}>+ Add task</button></div>{tasks.length ? <div className="task-list">{tasks.map(task => <TaskRow key={task.id} task={task} onChange={onTaskChange} notify={notify} />)}</div> : <Empty title="No tasks yet" detail="Add the first action that will move this project forward." />}</section><ProjectDialog project={project} id="edit-project-dialog" onSaved={async () => { await onProjectChange(); notify('Project updated.') }} /></div>
}
function TaskRow({ task, onChange, notify, compact = false }: { task: Task; onChange?: () => Promise<void>; notify?: (t: string) => void; compact?: boolean }) { const [busy, setBusy] = useState(false); async function update(input: Partial<TaskInput>) { if (!onChange) return; setBusy(true); try { await api.updateTask(task.id, input); await onChange() } catch (err) { notify?.(message(err)) } finally { setBusy(false) } } async function remove() { if (!confirm(`Delete “${task.title}”?`)) return; setBusy(true); try { await api.deleteTask(task.id); await onChange?.(); notify?.('Task deleted.') } catch (err) { notify?.(message(err)) } finally { setBusy(false) } } return <article className={`task-row ${task.status === 'done' ? 'done' : ''}`}><button className="check" aria-label="Toggle complete" disabled={busy || !onChange} onClick={() => update({ status: task.status === 'done' ? 'todo' : 'done' })}>{task.status === 'done' ? '✓' : ''}</button><div className="task-main"><strong>{task.title}</strong>{task.description && !compact && <span>{task.description}</span>}</div><span className={`badge priority ${task.priority}`}>{task.priority}</span>{task.due_date && <span className={isOverdue(task) ? 'overdue' : 'due'}>{isOverdue(task) ? 'Overdue · ' : ''}{formatDate(task.due_date)}</span>}{!compact && <><select aria-label={`Status for ${task.title}`} value={task.status} disabled={busy} onChange={e => update({ status: e.target.value as TaskStatus })}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select><select aria-label={`Priority for ${task.title}`} value={task.priority} disabled={busy} onChange={e => update({ priority: e.target.value as Priority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><button className="mini-button" onClick={remove} disabled={busy}>Delete</button></>}</article> }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className="empty"><span>✦</span><h3>{title}</h3><p>{detail}</p></div> }

function ProjectDialog({ project, id = 'project-dialog', onSaved }: { project?: Project; id?: string; onSaved: () => Promise<void> }) { const [form, setForm] = useState<ProjectInput>(project ? { name: project.name, description: project.description, status: project.status, target_date: project.target_date } : blankProject); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { if (project) setForm({ name: project.name, description: project.description, status: project.status, target_date: project.target_date }) }, [project])
  async function save(event: FormEvent) { event.preventDefault(); if (!form.name.trim()) return setError('A project name is required.'); setBusy(true); setError(''); try { project ? await api.updateProject(project.id, form) : await api.createProject(form); (document.getElementById(id) as HTMLDialogElement)?.close(); if (!project) setForm(blankProject); await onSaved() } catch (err) { setError(message(err)) } finally { setBusy(false) } }
  return <dialog id={id}><form method="dialog" className="dialog" onSubmit={save}><div className="dialog-title"><h2>{project ? 'Edit project' : 'New project'}</h2><button aria-label="Close">×</button></div>{error && <div className="alert error">{error}</div>}<label>Name<input autoFocus value={form.name} onChange={e => setForm({...form, name:e.target.value})} maxLength={120} /></label><label>Description<textarea value={form.description ?? ''} onChange={e => setForm({...form, description:e.target.value || null})} maxLength={1000} rows={3} /></label><div className="two-col"><label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value as ProjectStatus})}><option value="active">Active</option><option value="on_hold">On hold</option><option value="completed">Completed</option></select></label><label>Target date<input type="date" value={dateValue(form.target_date)} onChange={e => setForm({...form, target_date:e.target.value || null})} /></label></div><button className="primary wide" disabled={busy}>{busy ? 'Saving…' : 'Save project'}</button></form></dialog>
}
function TaskDialog({ projectId, onSaved }: { projectId: string; onSaved: () => Promise<void> }) { const [form, setForm] = useState<TaskInput>(blankTask); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); async function save(event: FormEvent) { event.preventDefault(); if (!form.title.trim()) return setError('A task title is required.'); setBusy(true); setError(''); try { await api.createTask(projectId, form); (document.getElementById('task-dialog') as HTMLDialogElement)?.close(); setForm(blankTask); await onSaved() } catch (err) { setError(message(err)) } finally { setBusy(false) } } return <dialog id="task-dialog"><form method="dialog" className="dialog" onSubmit={save}><div className="dialog-title"><h2>New task</h2><button aria-label="Close">×</button></div>{error && <div className="alert error">{error}</div>}<label>Task title<input autoFocus value={form.title} onChange={e => setForm({...form, title:e.target.value})} maxLength={180} /></label><label>Description<textarea value={form.description ?? ''} onChange={e => setForm({...form, description:e.target.value || null})} rows={3} /></label><div className="three-col"><label>Status<select value={form.status} onChange={e => setForm({...form, status:e.target.value as TaskStatus})}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label><label>Priority<select value={form.priority} onChange={e => setForm({...form, priority:e.target.value as Priority})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input type="date" value={dateValue(form.due_date)} onChange={e => setForm({...form, due_date:e.target.value || null})} /></label></div><button className="primary wide" disabled={busy}>{busy ? 'Saving…' : 'Add task'}</button></form></dialog> }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`)) }
function message(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.' }
export default App
