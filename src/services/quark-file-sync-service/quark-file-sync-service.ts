import fs from "fs/promises";
import os from "os";
import path from "path";
import type { Quark } from "react-quarks";
import { MutexStore } from "../../utils/mutex-store";

const FILE_DATA_DIR = path.resolve(
  os.homedir(),
  "./.local/share/untitled-slack-client"
);

/**
 * This service is responsible for saving quarks data as files,
 * and loading them back into quarks when the app starts.
 *
 * Quark data files are located in the home, in the subdirectors:
 * `.local/share/untitled-slack-client/`.
 */
export class QuarkFileSyncService {
  static {
    QuarkFileSyncService.ensureAppDirExists();
  }

  static fileMutex = new MutexStore();

  private static getFilenameFor(name: string) {
    return `${name}.json`;
  }

  private static async ensureAppDirExists() {
    try {
      await fs.mkdir(FILE_DATA_DIR, { recursive: true });
    } catch (e) {
      if ((e as any).code === "EEXIST") {
        return;
      } else throw e;
    }
  }

  /**
   * Saves the given object as a JSON file under the specified
   * name.
   */
  private static async save(filename: string, object: object) {
    this.fileMutex.acquire(filename);
    try {
      return await fs.writeFile(
        path.resolve(FILE_DATA_DIR, filename),
        JSON.stringify(object, null, 2)
      );
    } finally {
      this.fileMutex.release(filename);
    }
  }

  /**
   * Loads the JSON file with the given name and returns it if it
   * exists, or `undefined` if it doesn't.
   */
  private static async load<T>(filename: string): Promise<T | undefined> {
    this.fileMutex.acquire(filename);
    try {
      const data = await fs.readFile(path.resolve(FILE_DATA_DIR, filename));
      return JSON.parse(data.toString()) as T;
    } catch (e) {
      return undefined;
    } finally {
      this.fileMutex.release(filename);
    }
  }

  /**
   * Registers a quark to this service, whenever the quark's
   * state changes, the service will save the quark's data to a
   * file. When the quark is being registered, the service will
   * try to load the quark's data from a file and update the
   * quark's state.
   */
  static async registerQuark<T extends object>(
    name: string,
    quark: Quark<T, any>
  ) {
    const cachedValue = await this.load<T>(this.getFilenameFor(name));

    if (cachedValue) {
      quark.set(cachedValue);
    } else {
      this.save(this.getFilenameFor(name), quark.get());
    }

    quark.subscribe((state) => {
      this.save(this.getFilenameFor(name), state);
    });
  }
}
