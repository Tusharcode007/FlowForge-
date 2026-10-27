# Product status

| Feature | Problem solved | Priority | Status | Files / objects | Acceptance evidence | Remaining work |
|---|---|---:|---|---|---|---|
| Authentication | Isolate a person’s workspace | P0 | partial | `src/App.tsx`, Supabase Auth | Sign-in/sign-up calls are implemented; external credentials not supplied | Browser verification with configured Supabase |
| Project CRUD | Organize related work | P0 | implemented | `App.tsx`, `projects` | Create, list, edit, view, and confirmed delete flows implemented | Verify against live database |
| Task workflow | Track individual actionable work | P0 | partial | `App.tsx`, `tasks` | Create, priority/status updates, completion, and confirmed deletion implemented | Add full title/description/due-date edit dialog |
| Progress & overdue | Understand what needs attention | P0 | implemented | `App.tsx` | Values computed from loaded task data; no hardcoded metrics | Verify live data refresh |
| Persistence & RLS | Preserve and protect data | P0 | partial | `schema.sql`, `api.ts` | Schema, indexes, RLS policies and API implemented | Apply SQL and test with two users |
| Error/loading/empty states | Make outcomes understandable | P0 | implemented | `App.tsx` | Setup, loading, validation, API error, empty, and mutation-disabled states present | Add automated UI tests |

## End-to-end workflow

1. A user signs in.
2. They create a project with an optional description and target date.
3. They open it and create tasks with priority, status, and optional due date.
4. Completing tasks updates actual progress and the dashboard summary on refresh.
5. RLS ensures another authenticated user cannot view or mutate these records.
