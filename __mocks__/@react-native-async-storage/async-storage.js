const store = {}

const AsyncStorageMock = {
  setItem: jest.fn(async (key, value) => {
    store[key] = value
    return Promise.resolve()
  }),
  getItem: jest.fn(async (key) => {
    return Promise.resolve(store[key] || null)
  }),
  removeItem: jest.fn(async (key) => {
    delete store[key]
    return Promise.resolve()
  }),
  multiSet: jest.fn(async (items) => {
    items.forEach(([key, value]) => {
      store[key] = value
    })
    return Promise.resolve()
  }),
  multiGet: jest.fn(async (keys) => {
    return Promise.resolve(keys.map((key) => [key, store[key] || null]))
  }),
  multiRemove: jest.fn(async (keys) => {
    keys.forEach((key) => {
      delete store[key]
    })
    return Promise.resolve()
  }),
  getAllKeys: jest.fn(async () => {
    return Promise.resolve(Object.keys(store))
  }),
  clear: jest.fn(async () => {
    Object.keys(store).forEach((key) => {
      delete store[key]
    })
    return Promise.resolve()
  }),
}

module.exports = AsyncStorageMock
