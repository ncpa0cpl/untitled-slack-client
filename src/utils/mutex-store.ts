import { Mutex } from "@ncpa0cpl/mutex.js";

export class MutexStore {
  private mutexes = new Map<string, Mutex>();

  private get(name: string) {
    if (!this.mutexes.has(name)) {
      this.mutexes.set(name, new Mutex());
    }

    return this.mutexes.get(name)!;
  }

  acquire(name: string) {
    const mutex = this.get(name);

    return mutex.acquire();
  }

  release(name: string) {
    const mutex = this.get(name);

    return mutex.release();
  }
}
