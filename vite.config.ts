import vue from '@vitejs/plugin-vue'
import { fileURLToPath, pathToFileURL, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      emitFile: true,
      filename: 'stats.html',
      template: 'sunburst', // or sunburst
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    cssMinify: 'lightningcss',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: function manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: ['.vue', '.ts', '.js', '.json']
  },
  css: {
    // transformer: 'lightningcss',
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        importers: [
          {
            /**
             * An importer that redirects relative URLs starting with "~" to
             * `node_modules`.
             */
            findFileUrl(url: string) {
              if (!url.startsWith('~')) return null
              return new URL(url.substring(1), pathToFileURL('node_modules'))
            }
          },
          {
            /**
             * An importer that redirects relative URLs starting with "@styles"
             * to `src/styles`.
             */
            findFileUrl(url: string) {
              if (!url.startsWith('@styles')) return null
              return new URL(url.substring(1), pathToFileURL('src/styles'))
            }
          }
        ]
      }
    }
  }
})
