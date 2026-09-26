import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "coverage/**", "app/dist/**"] },
  ...tseslint.configs.strictTypeChecked,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    // Componentes Svelte: el script se analiza con el parser de TypeScript y con tipos.
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // En tests se permite "!" para acceder a datos de tablas conocidos.
    files: ["packages/*/test/**/*.ts"],
    rules: { "@typescript-eslint/no-non-null-assertion": "off" },
  },
  { files: ["**/*.js"], ...tseslint.configs.disableTypeChecked },
);
