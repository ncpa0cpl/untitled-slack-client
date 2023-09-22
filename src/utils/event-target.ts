import { Logger } from "./logger";

export interface EventListener<
  Events extends Record<string, any>,
  E extends keyof Events,
> {
  (data: Events[E]): void;
}

export class EventTarget<Events extends Record<string, any>> {
  protected parent?: EventTarget<Events>;
  private _listenersList: [keyof Events, EventListener<any, any>[]][] = [];

  public on<E extends keyof Events>(
    event: E,
    listener: EventListener<Events, E>,
  ) {
    const [, listeners] = this._listenersList.find((l) => l[0] === event) ?? [];
    if (listeners) {
      listeners.push(listener);
    } else {
      this._listenersList.push([event, [listener]]);
    }

    return () => this.off(event, listener);
  }

  public off<E extends keyof Events>(
    event: E,
    listener: EventListener<Events, E>,
  ) {
    const [, listeners] = this._listenersList.find((l) => l[0] === event) ?? [];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public emitSync<E extends keyof Events>(event: E, data: Events[E]) {
    const [, listeners] = this._listenersList.find((l) => l[0] === event) ?? [];
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i]!;
        try {
          listener(data);
        } catch (e) {
          Logger.error(e);
        }
      }

      if (this.parent) {
        this.parent.emitSync(event, data);
      }
    }
  }

  public emit<E extends keyof Events>(event: E, data: Events[E]) {
    const [, listeners] = this._listenersList.find((l) => l[0] === event) ?? [];

    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        const listener = listeners[i]!;
        setTimeout(() => {
          try {
            listener(data);
          } catch (e) {
            Logger.error(e);
          }
        }, 0);
      }
    }

    if (this.parent) {
      this.parent.emit(event, data);
    }
  }
}
