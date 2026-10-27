import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Supports the standard Vite names and the names supplied by the Vercel/Supabase integration.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
