const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')
const fs = require('fs')

const config = getDefaultConfig(__dirname)

// ─── Fix 1: serve canvaskit.wasm locally ──────────────────────────────────────
// Metro doesn't serve .wasm files from node_modules. We intercept GET /canvaskit.wasm
// and pipe the file directly so LoadSkiaWeb() can resolve without a CDN.
const WASM_PATH = path.join(
  __dirname,
  'node_modules/canvaskit-wasm/bin/full/canvaskit.wasm',
)

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, _server) => {
    return (req, res, next) => {
      // Log all requests in CI so metro.log captures the exact bundle URL params
      // that expo-dev-client uses (needed to pre-warm with the correct cache key).
      if (process.env.CI) {
        console.log(`[metro-req] ${req.method} ${req.url}`)
      }
      if (req.url === '/canvaskit.wasm') {
        res.setHeader('Content-Type', 'application/wasm')
        fs.createReadStream(WASM_PATH).pipe(res)
        return
      }
      return metroMiddleware(req, res, next)
    }
  },
}

// ─── Fix 2: lazy Skia API proxy ───────────────────────────────────────────────
// Skia.web.js runs `export const Skia = JsiSkApi(global.CanvasKit)` at Metro
// bundle load time — before LoadSkiaWeb() has set global.CanvasKit. This makes
// the Skia object permanently close over `undefined`, causing Matrix errors.
// We redirect the resolution to patches/SkiaWeb.js which defers JsiSkApi creation
// until the first property access (by which time LoadSkiaWeb has completed).
const SKIA_WEB_PATCH = path.join(__dirname, 'patches/SkiaWeb.js')

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // tone is a Web Audio API library — not available in React Native.
    // Stub it out on native so AudioManager's module-level imports don't pull
    // in Web Audio API calls that crash on Android/iOS at import time.
    if (platform !== 'web' && (moduleName === 'tone' || moduleName.startsWith('tone/'))) {
      return { type: 'empty' }
    }

    // canvaskit-wasm is the WASM Skia loader — only valid on web.
    // On Android/iOS, @shopify/react-native-skia uses native C++ Skia instead.
    // Metro statically bundles all dynamic imports, so we must stub this out
    // before canvaskit.js reaches Metro's resolver with its require('fs') call.
    if (platform !== 'web' && moduleName.includes('canvaskit-wasm')) {
      return { type: 'empty' }
    }

    const resolution = context.resolveRequest(context, moduleName, platform)

    // Also catch any resolved file inside the canvaskit-wasm package
    if (
      platform !== 'web' &&
      resolution.type === 'sourceFile' &&
      resolution.filePath.replace(/\\/g, '/').includes('canvaskit-wasm')
    ) {
      return { type: 'empty' }
    }

    if (
      platform === 'web' &&
      resolution.type === 'sourceFile' &&
      resolution.filePath.replace(/\\/g, '/').endsWith('skia/Skia.web.js')
    ) {
      return { type: 'sourceFile', filePath: SKIA_WEB_PATCH }
    }
    return resolution
  },
}

module.exports = config
