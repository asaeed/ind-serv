// Gameplay uses 60 small simulation steps per second even when the browser draws
// fewer frames. Small steps preserve collision checks and tap-to-move waypoints.
export default class FixedStepLoop {
  constructor(update, fps = 60, maxSteps = 6) {
    this.update = update
    this.stepMs = 1000 / fps
    this.maxElapsedMs = this.stepMs * maxSteps
    this.reset()
  }

  reset() {
    this.previousTime = null
    this.accumulator = 0
  }

  advance(timestamp) {
    if (this.previousTime === null) {
      this.previousTime = timestamp
      return
    }

    // Discard long stalls instead of teleporting or spending seconds catching up.
    const elapsed = Math.min(Math.max(0, timestamp - this.previousTime), this.maxElapsedMs)
    this.previousTime = timestamp
    this.accumulator += elapsed

    // Allow for floating-point rounding at exact multiples of a simulation step.
    while (this.accumulator + 1e-7 >= this.stepMs) {
      this.accumulator = Math.max(0, this.accumulator - this.stepMs)
      this.update()
    }
  }
}
