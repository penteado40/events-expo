/**
 * Pins the clock to `now` for the test file: Início reads it at render. Fakes only `Date`, so
 * timers stay real and queries and renders run as usual.
 */
export function pinClock(now: Date) {
  beforeAll(() =>
    jest.useFakeTimers({
      now,
      doNotFake: [
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    }),
  )
  afterAll(() => jest.useRealTimers())
}
