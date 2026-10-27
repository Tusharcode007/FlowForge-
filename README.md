# FlowForge

FlowForge is a focused project-execution workspace for turning projects into actionable tasks, tracking actual completion, and seeing overdue work at a glance.

It helps an individual or small team answer three practical questions: **what are we working on, what needs attention, and what should happen next?**

## Stack

- React 19, TypeScript, and Vite
- Supabase Auth and PostgreSQL via `@supabase/supabase-js`
- Plain responsive CSS (no component library required)

## Quick start

1. Install Node.js 20+ and clone this repository.
2. Install dependencies: `npm install`
3. In Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql).
4. Copy `.env.example` to `.env.local` and set these public browser variables:

   ```bash
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-or-publishable-key>
   ```

5. In Supabase Authentication settings, enable Email/Password. For a quick local demonstration, either confirm the signup email or disable **Confirm email** temporarily in the development project.
6. Start: `npm run dev`

Build the production bundle with `npm run build`. Preview it with `npm run preview`.

## Features

- Email/password sign-up and sign-in via Supabase Auth
- Project creation, viewing, editing, and confirmed deletion
- Task creation, priority/status updates, complete/uncomplete controls, and confirmed deletion
- Actual progress based on completed tasks; empty projects show no implied progress
- Dashboard totals, project cards, chronological focus list, and overdue task detection
- Supabase persistence and user-isolated database access through RLS

## Database and security

The supplied SQL creates `projects` and `tasks`, uses UUIDs, cascades task deletion when a project is removed, validates allowed status/priority values, maintains `updated_at`, adds targeted indexes, and enables Row Level Security. Policies scope every query to `auth.uid()`. A trigger also rewrites a new task's `owner_id` to the authenticated user and rejects tasks assigned to a project the user does not own.

Never use a service-role key in `.env` for this frontend. Only the Supabase URL and anonymous/publishable browser key belong there.

## Project structure

```text
src/                 React application, UI, types, and Supabase data layer
supabase/schema.sql  Database schema, triggers, indexes, and RLS policies
docs/                Architecture, feature status, code map, and handover notes
.env.example         Public environment-variable template
```

## Verification

`npm run build` is the available automated verification. Database/auth workflow requires a configured Supabase project. See [the handover notes](docs/handover.md) for current verification status and follow-up work.

## Deployment

### Vercel

1. Import this GitHub repository at [vercel.com/new](https://vercel.com/new).
2. Keep Vercel’s detected **Vite** preset and build command: `npm run build`.
3. Add these environment variables in **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   The connected Supabase integration also provides compatible `NEXT_PUBLIC_SUPABASE_…` variables automatically.
4. Deploy. After it finishes, copy the Vercel URL.
5. In Supabase go to **Authentication → URL Configuration** and add that URL to **Redirect URLs**. Set it as the Site URL if this is your production app.

Never add a Supabase secret/service-role key to Vercel’s frontend variables.

## Documentation

- [Architecture](docs/architect.md)
- [Codebase map](docs/code.md)
- [Feature status](docs/feature.md)
- [Handover notes](docs/handover.md)

## Current limitations

- There is no full task-detail editing dialog yet; tasks support creation, priority/status changes, and deletion.
- No filtering/search, collaboration, or AI suggestion feature is included in this deadline-focused MVP.
