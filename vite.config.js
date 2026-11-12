import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 깃허브 Pages에서는 저장소 이름 아래 경로로 열리므로 빌드할 때만 VITE_BASE를 넣는다.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
