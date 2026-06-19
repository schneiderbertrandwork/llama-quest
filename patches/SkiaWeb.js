// Root cause: Skia.web.js runs `export const Skia = JsiSkApi(global.CanvasKit)` at Metro bundle
// load time, before LoadSkiaWeb() has set global.CanvasKit.
//
// Secondary issue: skia/core exports (AnimatedImage, Image, SVG, Typeface) do
//   const factory = Skia.Foo.Bar.bind(Skia.Foo)
// at module load time. A simple first-access proxy throws immediately on these .bind() chains.
//
// Fix: deeply lazy proxy — property accesses and .bind() chains build resolver closures without
// touching CanvasKit. Only when the resulting function is actually CALLED does getRealApi() run.
import { JsiSkApi } from '@shopify/react-native-skia/lib/module/skia/web/JsiSkia'

let _api = null

function getRealApi() {
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

// Returns a callable Proxy that defers CanvasKit access until invocation.
// Handles `Skia.Foo.Bar.bind(Skia.Foo)` patterns at module load time safely.
function makeLazy(resolver) {
  return new Proxy(function () {}, {
    get(_, prop) {
      if (prop === '__lazyResolve') return resolver
      if (prop === 'bind') {
        return (ctx, ...preArgs) =>
          makeLazy(() => {
            const fn = resolver()
            const realCtx = ctx && ctx.__lazyResolve ? ctx.__lazyResolve() : ctx
            return fn.bind(realCtx, ...preArgs)
          })
      }
      return makeLazy(() => resolver()[prop])
    },
    apply(_, thisArg, args) {
      return resolver().apply(thisArg, args)
    },
    has(_, prop) {
      return true
    },
  })
}

export const Skia = new Proxy(
  {},
  {
    get(_, prop) {
      if (prop === '__lazyResolve') return getRealApi
      if (_api) return _api[prop]
      return makeLazy(() => getRealApi()[prop])
    },
    has(_, prop) {
      if (!_api) return true
      return prop in _api
    },
  },
)
