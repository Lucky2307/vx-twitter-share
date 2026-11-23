module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // Git stores LF, but core.autocrlf converts checkouts to CRLF on Windows.
    // airbnb enables this rule, which then fails on every line for Windows users.
    'linebreak-style': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'utils/',
    'vx-twitter-share/',
    '*.zip',
  ],
};
