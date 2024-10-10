/* eslint-env node */
/** @type {import("prettier").Config} */
const config = {
  plugins: [
    "prettier-plugin-tailwindcss",
  ],
  tailwindFunctions: ["cva"],
  printWidth: 100,
  tabWidth: 2,
  singleQuote: false,
  quoteProps: "as-needed",
};

export default config;
