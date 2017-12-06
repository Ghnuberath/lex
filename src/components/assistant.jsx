import { Builder } from './builder';

/**
 * Richer interaction areas for building values.
 *
 * These have no read-only mode, and are utilized as "drop-downs"
 * to provide additional interactivity and visualization as users
 */
export class Assistant extends Builder {
  renderReadOnly (props, state) {
    // do nothing
  }
}