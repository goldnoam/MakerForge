import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Expose process.env.API_KEY for the frontend if using .env files or Vercel env vars
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});