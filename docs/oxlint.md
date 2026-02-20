# Oxlint

## General

Useful links:

- typescript-eslint: <https://github.com/oxc-project/oxc/issues/2180>
- oxlint rules: <https://oxc.rs/docs/guide/usage/linter/rules.html>

## Eslint to Oxlint migration results

Performed on 2025-11-26 and updated 2026-02-20.

- unsupported rule: no-dupe-args
  - Not needed in modern code, strict is enforced by tsc
- unsupported rule: no-octal
  - Not needed in modern code, strict is enforced by tsc
- unsupported rule, but in development: no-undef
  - Not needed, handled by tsc
- unsupported rule: dot-notation
  - Replaced by `typescript/dot-notation`
- unsupported rule: new-parens
  - Is handled automatically by oxfmt
- unsupported rule: no-multiple-empty-lines
  - Is handled automatically by oxfmt
- unsupported rule: no-trailing-spaces
  - Is handled automatically by oxfmt
- unsupported rule: space-before-function-paren
  - Is handled automatically by oxfmt
- unsupported rule: semi
  - Is handled automatically by oxfmt
- unsupported rule: quotes
  - Is handled by oxfmt via config `"singleQuote": true`

## Changes

- All rules in nursery (=under development) and unsupported rules are accompanied by a comment in [.oxlintrc.json](../.oxlintrc.json)
- 2026-02-20: Deleted eslint and all plugins
