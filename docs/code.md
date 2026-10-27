# Codebase map

## Stack and commands

React 19 + TypeScript + Vite is the frontend. Supabase JS is the only external runtime client. Commands: `npm run dev`, `npm run build`, and `npm run preview`.

## Structure

- `src/main.tsx` mounts the React application.
- `src/App.tsx` owns auth state, loading/error state, dashboard, dialogs, project view, and task-status updates.
- `src/types.ts` is the shared project/task model and constrained status types.
- `src/lib/supabase.ts` safely creates the client only when the two public variables are configured.
- `src/lib/api.ts` centralizes database access and turns Supabase errors into rejected operations.
- `src/styles.css` contains the responsive design system.
- `supabase/schema.sql` is the source-controlled database setup.

## Data access

The UI calls `api.projects()` / `api.tasks()` for refreshes and individual CRUD methods for mutations. The browser never supplies an owner ID. The database defaults and trigger derive it from `auth.uid()`.

## Configuration

The preferred browser variables are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. For the Vercel/Supabase integration, the client also falls back to `NEXT_PUBLIC_SUPABASE_URL`, then `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the key. If both naming schemes are configured, the Vite variables take precedence. `vite.config.ts` allows both prefixes through to the client build.

Do not commit `.env` or put a secret/service-role key in any browser-exposed variable. Use `.env.example` as the local template.
