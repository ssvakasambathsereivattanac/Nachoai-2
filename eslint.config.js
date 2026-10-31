const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    // Server code: proper CommonJS modules, so dead code is worth flagging.
    files: ["server/**/*.js", "eslint.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2022,
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
    },
  },
  {
    // Front end: plain <script> files (no bundler/modules) that call each
    // other's top-level functions across files and expose a few globals
    // (e.g. window.NachoProgress) for other pages to use later, so
    // "unused" at the file level is expected and not flagged.
    files: ["public/js/**/*.js"],
    languageOptions: {
      sourceType: "script",
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        NachoProgress: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["server/test/**/*.js"],
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
    },
  },
];
