import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const supabaseUrl = env.VITE_SUPABASE_URL as string

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('/supabase-proxy'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/supabase-proxy': {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/supabase-proxy/, ''),
          secure: false,
        },
      },
    },
    optimizeDeps: {
      exclude: ['@electric-sql/pglite'],
    },
  }
})
