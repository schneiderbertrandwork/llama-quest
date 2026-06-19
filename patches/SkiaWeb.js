// Root cause of "Cannot read properties of undefined (reading 'Matrix')" on web:
// Skia.web.js runs `export const Skia = JsiSkApi(global.CanvasKit)` at Metro bundle
// load time — before LoadSkiaWeb() has set global.CanvasKit. The resulting Skia
// object permanently closes over `undefined` as its CanvasKit reference.
//
// This patch replaces that eager initialization with a lazy Proxy. The real
// JsiSkApi is only called on the FIRST property access, by which time
// _layout.tsx has awaited LoadSkiaWeb() and global.CanvasKit is the real thing.
import { JsiSkApi } from '@shopify/react-native-skia/lib/module/skia/web/JsiSkia'

let _api = null

function getApi() {
  if (!_api) {
    if (!global.CanvasKit) {
      throw new Error(
        '[Skia] CanvasKit not initialized. Ensure LoadSkiaWeb() has resolved before any Canvas renders.',
      )
    }
    _api = JsiSkApi(global.CanvasKit)
  }
  return _api
}

export const Skia = new Proxy(
  {},
  {
    get(_, prop) {
      return getApi()[prop]
    },
    has(_, prop) {
      return prop in getApi()
    },
  },
)
