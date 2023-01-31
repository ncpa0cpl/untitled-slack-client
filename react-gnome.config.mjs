import resolve from "esbuild-plugin-resolve";

export default () => {
  /** @type {import("react-gnome").BuildConfig} */
  const config = {
    applicationName: "ReactGnomeApp",
    applicationVersion: "1.0.0",
    entrypoint: "./src/start.tsx",
    outDir: "./dist",
    minify: false,
    treeShake: false,
    giVersions: {
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
      node: {
        path: true,
      },
    },
    customPolyfills: [
      {
        filepath: "./polyfills/process.js",
      },
      {
        filepath: "querystring-browser",
        importName: "querystring",
      },
      {
        filepath: "./polyfills/os.js",
        importName: "os",
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
    ],
    esbuildPlugins: [
      resolve({
        react: "/home/owner/Documents/untitled-slack-client/node_modules/react",
      }),
    ],
  };

  return config;
};
