import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Every page loads its data with the fetch-on-mount pattern - an effect that
      // calls a loader which sets state once the request settles - and the two
      // camera previews own an object URL the effect has to revoke. Both are the
      // documented uses of an effect, but this rule cannot tell them apart from a
      // synchronous setState, so it reports them all. Kept visible as a warning
      // rather than off, so a genuine derived-state effect still shows up.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
