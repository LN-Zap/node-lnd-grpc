// The default error handler of StateMachine do not throw regular js Errors with stack traces.
// https://github.com/jakesgordon/javascript-state-machine/blob/master/docs/error-handling.md#invalid-transitions
// Usage:
// new StateMachine({ ... methods: [ ..., onPendingTransition, onInvalidTransition ] })

export const onPendingTransition = (transition, from, to) => {
  throw Object.assign(new Error('transition already in progress'), { transition, from, to })
}

export const onInvalidTransition = (transition, from, to) => {
  throw Object.assign(new Error('transition is invalid in current state'), { transition, from, to })
}
