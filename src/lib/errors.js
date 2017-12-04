export class NoStateBuilderTypeError extends Error {
  constructor (stateClass) {
    super(`No state builder for State type: ${stateClass.name}`);
  }
}

export class StateTransitionError extends Error {}