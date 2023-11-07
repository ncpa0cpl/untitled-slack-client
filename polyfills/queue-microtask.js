import GLib from "gi://GLib";

const queueMicrotask = (task) => {
  imports.mainloop.idle_add(() => {
    task();
  }, GLib.PRIORITY_DEFAULT);
};

export default {
  queueMicrotask,
};
