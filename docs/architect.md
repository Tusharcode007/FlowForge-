# Architecture

## Implemented system

FlowForge is a client-rendered React application backed directly by Supabase Auth and PostgreSQL. This removes the need for a duplicate application server in the MVP while keeping authorization at the database boundary.

```mermaid
flowchart LR
  B[React browser app] -->|anonymous key + user JWT| A[Supabase Auth]
  B -->|RLS-protected CRUD| D[(PostgreSQL)]
  D --> P[projects]
  D --> T[tasks]
  P -->|1 : many, cascade delete| T
```

## Entities

`projects` holds a user-owned name, description, lifecycle status, and optional target date. `tasks` belongs to one project and carries title, optional description/due date, status, and priority. Both have UUID IDs and automatic timestamps.

## Auth and authorization

Email/password authentication is implemented through Supabase Auth. On every protected table, RLS is enabled. Policies authorize reads and mutations only when `owner_id = auth.uid()`. Task policies additionally verify the parent project is owned by the same user. A database trigger rejects cross-project task writes and derives task ownership from the authenticated session.

## Boundaries and trade-offs

The anonymous/publishable Supabase key is intentionally browser-visible; the service-role key is never used. The UI detects missing configuration and stops at an honest setup screen. The trade-off is that no server-only features or AI operations are in scope. A future server/Edge Function would be the correct place for privileged AI calls and integrations.
