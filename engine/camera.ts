export interface Camera {
  x: number
  y: number
}

export function followEntity(
  entity: { x: number; y: number },
  tileSize: number,
  screenW: number,
  screenH: number,
): Camera {
  return {
    x: entity.x * tileSize - screenW / 2,
    y: entity.y * tileSize - screenH / 2,
  }
}

export function clampCamera(
  camera: Camera,
  tileSize: number,
  gridW: number,
  gridH: number,
  screenW: number,
  screenH: number,
): Camera {
  const maxX = Math.max(0, gridW * tileSize - screenW)
  const maxY = Math.max(0, gridH * tileSize - screenH)
  return {
    x: Math.max(0, Math.min(camera.x, maxX)),
    y: Math.max(0, Math.min(camera.y, maxY)),
  }
}
