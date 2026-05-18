# Current workflow lint coverage

## Before

Issue #526 subset gate は `ci.yml` の `workflow-shell-lint` 内で 9 workflow を明示列挙していた。自己 lint を持つ workflow を含めても全 32 件のうち 21 件が gate 対象外だった。

## After

Issue #290 では `.github/workflows/*.yml` glob に変更し、現行 32 件を全件対象にした。

```text
.github/workflows/*.yml => 32 files
```

## Scope

`.yaml` 拡張子は現行 0 件。本タスクの AC は `.yml` 32 件を対象とする。
