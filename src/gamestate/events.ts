export class EventEmitter {
  private listeners: { [eventName: string]: Function[] };

  constructor() {
    this.listeners = {};
  }

  on(eventName: string, listener: Function) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
  }

  emit(eventName: string, ...args: any[]) {
    const eventListeners = this.listeners[eventName];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }
}

export class EventManager {
  private static instance: EventManager;
  private eventEmitter: EventEmitter;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  public on(eventName: string, listener: Function) {
    this.eventEmitter.on(eventName, listener);
  }

  public emit(eventName: string, ...args: any[]) {
    this.eventEmitter.emit(eventName, ...args);
  }
}

export default EventManager.getInstance();