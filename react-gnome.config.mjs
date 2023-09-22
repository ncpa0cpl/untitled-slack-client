import resolve from "esbuild-plugin-resolve";

export default () => {
  /**
   * @type {import("react-gnome").BuildConfig}
   */
  const config = {
    applicationName: "slack-client",
    friendlyName: "Slack Client",
    applicationVersion: "1.0.0",
    entrypoint: "./src/start.tsx",
    outDir: "./dist",
    minify: false,
    treeShake: false,
    giVersions: {
      Gtk: "3.0",
      Soup: "2.4",
    },
    polyfills: {
      AbortController: true,
      base64: true,
      Blob: true,
      Buffer: true,
      fetch: true,
      FormData: true,
      URL: true,
      XMLHttpRequest: true,
      WebSocket: true,
      node: {
        path: true,
        os: true,
        querystring: true,
      },
    },
    customPolyfills: [
      {
        filepath: "./polyfills/process.js",
      },
      {
        filepath: "./polyfills/zlib.js",
        importName: "zlib",
      },
      {
        filepath: "./polyfills/fs.js",
        importName: "fs",
      },
      {
        filepath: "./polyfills/util.js",
        importName: "util",
      },
      {
        filepath: "./polyfills/queue-microtask.js",
      },
    ],
    esbuildPlugins: [
      resolve({
        react: "/home/owner/Documents/untitled-slack-client/node_modules/react",
      }),
    ],
  };

  return config;
};
