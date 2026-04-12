/**
 * Simple event bus for decoupled cross-system communication.
 * Systems subscribe to events and emit them without direct references.
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Register a listener for an event.
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
  }

  /**
   * Register a one-time listener.
   * @param {string} event - Event name
   * @param {Function} callback - Handler function
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * Remove a listener.
   * @param {string} event - Event name
   * @param {Function} callback - Handler to remove
   */
  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to all registered listeners.
   * @param {string} event - Event name
   * @param {...*} args - Arguments passed to handlers
   */
  emit(event, ...args) {
    const listeners = this._listeners.get(event);
    if (!listeners) return;
    for (const callback of listeners) {
      callback(...args);
    }
  }

  /** Remove all listeners for an event, or all events if none specified. */
  clear(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

/** Singleton instance shared across the application */
export const eventBus = new EventBus();
