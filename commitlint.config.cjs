const config = {
    extends: ['@commitlint/config-conventional'],

    rules: {
        // ── Type ─────────────────────────────────────────────────────────────────
        // Exactly this set of types, lowercase, non-empty
        'type-enum': [
            2,
            'always',
            [
                'feat', //  New feature
                'fix', //   Bug fix
                'docs', //  Documentation only
                'style', // Formatting / whitespace (no logic change)
                'refactor', // Code change that's neither a fix nor a feature
                'perf', //  Performance improvement
                'test', //  Adding or correcting tests
                'build', // Build system or external-dependency changes
                'ci', //    CI configuration changes
                'chore', // Maintenance tasks (no src/test change)
                'revert', // Reverts a previous commit
            ],
        ],
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never'],

        // ── Scope ─────────────────────────────────────────────────────────────────
        // Optional, but must be lowercase when provided
        'scope-case': [2, 'always', 'lower-case'],

        // ── Subject ───────────────────────────────────────────────────────────────
        // Short description: non-empty, no trailing period, no title-casing
        'subject-empty': [2, 'never'],
        'subject-full-stop': [2, 'never', '.'],
        'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],

        // ── Length limits ──────────────────────────────────────────────────────────
        'header-max-length': [2, 'always', 100],
        'body-max-line-length': [2, 'always', 300],
        'footer-max-line-length': [2, 'always', 100],

        // ── Body / footer formatting ────────────────────────────────────────────────
        // Blank line required between header and body
        'body-leading-blank': [2, 'always'],
        // Blank line required between body and footer
        'footer-leading-blank': [1, 'always'],
    },

    helpUrl: 'https://www.conventionalcommits.org/',
};

module.exports = config;
