const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')
const fs = require('fs')

const config = getDefaultConfig(__dirname)

// Serve canvaskit.wasm from node_modules so Skia web initializes without a CDN.
// CanvasKit (Emscripten) looks for canvaskit.wasm at the origin root by default,
// so we intercept that request and pipe the file from node_modules.
const WASM_PATH = path.join(
  __dirname,
  'node_modules/canvaskit-wasm/bin/full/canvaskit.wasm',
)

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, _server) => {
    return (req, res, next) => {
      if (req.url === '/canvaskit.wasm') {
        res.setHeader('Content-Type', 'application/wasm')
        fs.createReadStream(WASM_PATH).pipe(res)
        return
      }
      return metroMiddleware(req, res, next)
    }
  },
}

module.exports = config
