import env from "gapp:env";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import path from "path";
import type { Quark } from "react-quarks";
import { fileExists, readFile, writeFile } from "../../utils/fs/fs-utils";
import { MutexStore } from "../../utils/mutex-store";

const FILE_DATA_DIR = path.resolve(GLib.get_user_config_dir(), env.appName);

/**
 * This service is responsible for saving quarks data as files,
 * and loading them back into quarks when the app starts.
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
      if (!fileExists(FILE_DATA_DIR))
        Gio.File.new_for_path(FILE_DATA_DIR).make_directory_with_parents(null);
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Saves the given object as a JSON file under the specified
   * name.
   */
  private static async save(filename: string, object: object) {
    this.fileMutex.acquire(filename);
    try {
      const filePath = path.resolve(FILE_DATA_DIR, filename);
      const contents = JSON.stringify(object, null, 2);

      await writeFile(filePath, contents, "utf8");
    } catch (e) {
      console.log(e);
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
      const data = await readFile(path.resolve(FILE_DATA_DIR, filename));
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
    const savedState = await this.load<T>(this.getFilenameFor(name));

    if (savedState) {
      quark.set(savedState);
    } else {
      this.save(this.getFilenameFor(name), quark.get());
    }

    quark.subscribe((state) => {
      this.save(this.getFilenameFor(name), state);
    });
  }
}
