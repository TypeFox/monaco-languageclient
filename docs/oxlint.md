# Oxlint

## General

Useful links:

- typescript-eslint: <https://github.com/oxc-project/oxc/issues/2180>
- oxlint rules: <https://oxc.rs/docs/guide/usage/linter/rules.html>

## Eslint to Oxlint migration results

Performed on 2025-11-26.

```shell
unsupported rule, but in development: constructor-super
unsupported rule, but in development: getter-return
unsupported rule: no-dupe-args
unsupported rule, but in development: no-misleading-character-class
unsupported rule: no-octal
unsupported rule, but in development: no-undef
unsupported rule, but in development: no-unreachable
unsupported rule: prefer-const
unsupported rule: dot-notation
unsupported rule: new-parens
unsupported rule: no-multiple-empty-lines
unsupported rule: no-trailing-spaces
unsupported rule: space-before-function-paren
unsupported rule: semi
unsupported rule: quotes
unsupported rule: @typescript-eslint/parameter-properties
unsupported rule: @typescript-eslint/no-unnecessary-condition
```

## Changes

- Replaced `@typescript-eslint/no-var-requires` with `no-var-requires`
- Turned of recommended rule `no-undef` after migration
- All rules in nursery (=under development) and unsupported rules are accompanied by a comment in [.oxlintrc.json](../.oxlintrc.json)
- All rules unsupported by oxlint are still contained in [eslint.config.mjs](../eslint.config.mjs) and applied by eslint.
- JsPlugins are instable in oxlint, therefore they are still contained in [eslint.config.mjs](../eslint.config.mjs) and applied by eslint.
