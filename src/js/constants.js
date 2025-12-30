// Game configuration constants
export const GAME_CONFIG = {
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 600,
  TILE_SIZE: 16,
  UPSCALE_FACTOR: 4,
  TARGET_FPS: 60,
}

// Player interaction distances and offsets
export const INTERACTION = {
  MAX_DISTANCE: 40, // Max distance to interact with objects
  CAMERA_OFFSET_X: 32, // Camera centering offset
  POSITION_OFFSET_Y: 14, // Y position adjustment for interactions
}

// NPC behavior configuration
export const NPC_CONFIG = {
  WANDER_INTERVAL: 3000, // Time between wander attempts (ms)
  MOVE_DURATION: 500, // How long NPC moves before stopping
}

// Particle effects configuration
export const PARTICLE_CONFIG = {
  DEFAULT_SPEED_MIN: 2,
  DEFAULT_SPEED_MAX: 5,
  DEFAULT_SIZE_MIN: 3,
  DEFAULT_SIZE_MAX: 6,
  DEFAULT_LIFETIME: 30,
}

// Sprite configuration defaults
export const SPRITE_DEFAULTS = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  blocksWidth: 1,
  blocksHeight: 1,
}
