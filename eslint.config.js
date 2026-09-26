import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "coverage/**"] },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    // En tests se permite "!" para acceder a datos de tablas conocidos.
    files: ["packages/*/test/**/*.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },
);
