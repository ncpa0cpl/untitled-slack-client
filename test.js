#!@GJS@

imports.package.init({
  name: "org.gnome.slack-client",
  version: "@PACKAGE_VERSION@",
  prefix: "@prefix@",
  libdir: "@libdir@",
});

Object.assign(globalThis, {
  MAIN_LOOP_NAME: "react-gnome-app:main-loop",
});

import("./dist/.build/src/main.js")
  .then((main) => {
    imports.package.run(main);
  })
  .catch((error) => {
    console.error(error);
    imports.system.exit(1);
  });

// Main Loop must be started from this entry file, or otherwise all Promises block until main loop exits
// See https://gitlab.gnome.org/GNOME/gjs/-/issues/468 for more details
imports.mainloop.run(MAIN_LOOP_NAME);
