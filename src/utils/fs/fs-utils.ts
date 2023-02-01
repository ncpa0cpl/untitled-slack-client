import Gio from "gi://Gio";
import GLib from "gi://GLib";

function _async<T = void>(
  callback: (promise: { resolve(v: T): void; reject(e: any): void }) => void
) {
  return new Promise<T>(async (resolve, reject) => {
    try {
      await callback({ resolve, reject });
    } catch (err) {
      reject(err);
    }
  });
}

export const writeFile = async (
  path: string,
  data: string | Uint8Array | Buffer,
  options:
    | { encoding?: BufferEncoding; mode?: number; flag?: string }
    | BufferEncoding = {}
) => {
  const encoding: BufferEncoding =
    (typeof options === "object" ? options?.encoding : options) ?? "utf8";

  return _async((p) => {
    const file = Gio.File.new_for_path(path.toString());

    let bytes: Uint8Array;

    if (typeof data === "string") {
      const buff = new Buffer(data, encoding);
      bytes = new Uint8Array(buff);
    } else {
      const buff = data as Buffer | Buffer[];
      bytes = Array.isArray(buff)
        ? (buff.map((b) => new Uint8Array(b)).flat() as any as Uint8Array)
        : new Uint8Array(buff);
    }

    // @ts-expect-error
    file.replace_contents_async(
      bytes as any,
      null,
      false,
      Gio.FileCreateFlags.REPLACE_DESTINATION,
      null,
      // @ts-expect-error
      (_, result) => {
        try {
          file.replace_contents_finish(result);
          p.resolve(undefined);
        } catch (error) {
          p.reject(error);
        }
      }
    );
  });
};

export const readFile = async (
  path: string,
  options: { encoding?: BufferEncoding; flag?: string } | BufferEncoding = {}
) => {
  return _async<any>((p) => {
    const encoding = typeof options === "string" ? options : options?.encoding;

    const file = Gio.File.new_for_path(path.toString());

    file.load_contents_async(null, (_, result) => {
      try {
        const [success, contents] = file.load_contents_finish(result);
        if (success) {
          if (encoding) {
            const decoder = new TextDecoder(encoding);
            p.resolve(decoder.decode(contents as any));
          } else {
            p.resolve(Buffer.from(contents));
          }
        } else {
          p.reject(new Error("Could not read file."));
        }
      } catch (error) {
        p.reject(error);
      }
    });
  });
};

export const mkdir = async (
  path: string,
  options?: { recursive?: boolean }
) => {
  return _async((p) => {
    const file = Gio.File.new_for_path(path.toString());

    if (typeof options === "object" && options?.recursive) {
      throw new Error(
        "Recursive asynchronous directory creation is not currently supported."
      );
    }

    file.make_directory_async(
      GLib.PRIORITY_DEFAULT,
      null,
      async (_, result) => {
        try {
          if (!file.make_directory_finish(result)) {
            throw new Error(`Failed to create directory: ${path}`);
          }

          p.resolve(undefined);
        } catch (error) {
          p.reject(error);
        }
      }
    );
  });
};

export const fileExists = (path: string) => {
  const file = Gio.File.new_for_path(path.toString());

  return file.query_exists(null);
};
