import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/FLT_Mountain_Wave_Calc/', // must match your repo name exactly
})
