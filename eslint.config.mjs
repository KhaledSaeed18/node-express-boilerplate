// @ts-check
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
    // ── Ignored paths ──────────────────────────────────────────────────────────
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'src/generated/**',
            'prisma.config.ts',
            'prisma/**',
        ],
    },

    // ── TypeScript source files ─────────────────────────────────────────────────
    {
        files: ['src/**/*.ts'],
        extends: [
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            eslintConfigPrettier,
        ],
        languageOptions: {
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // ── TypeScript strictness ───────────────────────────────────────────
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // Require explicit return types on class methods and standalone
            // functions; arrow function expressions are exempt (they are
            // typically typed through their variable declaration or interface).
            '@typescript-eslint/explicit-function-return-type': [
                'error',
                {
                    allowExpressions: true,
                    allowTypedFunctionExpressions: true,
                    allowHigherOrderFunctions: true,
                    allowDirectConstAssertionInArrowFunctions: true,
                },
            ],

            // Every class member must carry an explicit access modifier so the
            // public API surface is always visible at a glance.
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        constructors: 'no-public',
                        accessors: 'explicit',
                        parameterProperties: 'explicit',
                    },
                },
            ],

            // Force `import type` for type-only imports to keep runtime bundles
            // clean and make the intent unambiguous.
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports',
                },
            ],
            '@typescript-eslint/consistent-type-exports': 'error',
            '@typescript-eslint/no-import-type-side-effects': 'error',

            // Promise discipline
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: { attributes: false } },
            ],
            '@typescript-eslint/await-thenable': 'error',

            // Safer alternatives to loose operators
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',

            // Only allow throwing actual Error objects
            '@typescript-eslint/only-throw-error': 'error',

            // Controller methods are arrow function class properties (inherently
            // bound to `this`); typescript-eslint cannot distinguish them from
            // prototype methods at the type level, so disable the rule here.
            '@typescript-eslint/unbound-method': 'off',

            // Express global type augmentation (declare global { namespace Express
            // { ... } }) is the only correct way to extend Express's Request/
            // Response types; disabling the namespace rule for this project.
            '@typescript-eslint/no-namespace': 'off',

            // Honour the conventional `_param` prefix for intentionally unused
            // function parameters (e.g. `_next` in 4-argument error middleware).
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],

            // ── General code quality ────────────────────────────────────────────
            'no-console': 'warn',
            'no-debugger': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always'],
        },
    },
)
