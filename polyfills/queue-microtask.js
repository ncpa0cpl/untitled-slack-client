import GLib from "gi://GLib";

export const queueMicrotask = (task) => {
  imports.mainloop.idle_add(() => {
    task();
  }, GLib.PRIORITY_DEFAULT);
};
