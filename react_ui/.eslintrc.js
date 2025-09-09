module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    "react-app", // Uses the configuration from eslint-config-react-app that comes with CRA
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: [
    "react",
    "react-hooks",
    "@typescript-eslint",
    "jsx-a11y",
    "import",
    "flowtype",
  ],
  rules: {
    // Allow console.log for debugging but warn about it
    "no-console": "warn",

    // TypeScript specific rules (compatible with v2.34.0)
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",

    // React specific rules
    "react/prop-types": "off", // Using TypeScript for prop validation
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",

    // General rules
    "prefer-const": "error",
    "no-var": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: [
    "build/",
    "node_modules/",
    "public/",
    "*.config.js",
    "serviceWorker.js",
  ],
};
