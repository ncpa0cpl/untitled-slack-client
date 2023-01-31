export const readFileSync = (path, options) => {
  const encoding = typeof options === "string" ? options : options?.encoding;

  const file = Gio.File.new_for_path(path.toString());

  const [success, buffer] = file.load_contents();

  if (!success) {
    new Error("Could not read file.");
  }

  if (encoding) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  } else {
    Buffer.from(buffer);
  }
};
