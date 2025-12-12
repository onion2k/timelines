import fs from "fs"
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

const branchTracksEnv = process.env.BRANCH_TRACKS_FILE || process.env.npm_config_branchTracks || process.env.npm_config_tracks
const branchTracksArg = process.argv.find((arg) => arg.startsWith('--branchTracks=') || arg.startsWith('--tracks='))
const branchTracksFile =
  branchTracksEnv ?? (branchTracksArg ? branchTracksArg.split('=').slice(1).join('=') : null)
const resolvedBranchTracksData = (() => {
  if (!branchTracksFile) return undefined
  const filePath = path.resolve(branchTracksFile)
  if (!fs.existsSync(filePath)) {
    throw new Error(`[timeline] Branch tracks file not found: ${filePath}`)
  }
  const raw = fs.readFileSync(filePath, 'utf8')
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.error(`[timeline] Failed to parse branch tracks file: ${filePath}`)
    throw err
  }
})()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  define: {
    __BRANCH_TRACKS_DATA__:
      resolvedBranchTracksData !== undefined ? JSON.stringify(resolvedBranchTracksData) : 'undefined',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
