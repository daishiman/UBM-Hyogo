# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 名称 | カバレッジ確認 |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

本タスクは「token 値カバレッジ」が主軸（実コードロジックは少ない）。task-08 inventory の token 種類数に対する `tokens.css` の被覆率と、`@theme` bridge 被覆率を表で記録する。

## カバレッジ表（token カバレッジ）

| カテゴリ | required | tokens.css 実装 | @theme bridge | 被覆率 |
| --- | --- | --- | --- | --- |
| color: surface (bg/panel/ink/muted/line) | 5 | _N_ | _N_ | _N_/5 |
| color: accent (base/soft/ink) | 3 | _N_ | _N_ | _N_/3 |
| color: status (8) | 8 | _N_ | _N_ | _N_/8 |
| color: zone (a..e) | 5 | _N_ | _N_ | _N_/5 |
| radius (sm/md/lg/xl/pill) | 5 | _N_ | _N_ | _N_/5 |
| shadow (sm/md/lg) | 3 | _N_ | _N_ | _N_/3 |
| font (sans/mono) | 2 | _N_ | _N_ | _N_/2 |
| font-size (xs..3xl) | 7 | _N_ | _N_ | _N_/7 |
| spacing (1..12) | 7 | _N_ | n/a (bridge 不要) | _N_/7 |
| motion duration (fast/base/slow) | 3 | _N_ | n/a | _N_/3 |
| **合計** | **48** | _N_ | _N_ | _N_/48 |

> 数値は Phase 7 実行時に grep で埋める。被覆率 100% を完了条件とする。

## 自動収集スクリプト

```bash
#!/usr/bin/env bash
# outputs/phase-7/collect-coverage.sh
set -euo pipefail
TOKENS=apps/web/src/styles/tokens.css
GLOBALS=apps/web/src/styles/globals.css

count() { grep -cE "$1" "$2" || echo 0; }

echo "## tokens.css coverage"
echo "- color-* tokens: $(count '^\s*--ubm-color-' $TOKENS)"
echo "- radius-* tokens: $(count '^\s*--ubm-radius-' $TOKENS)"
echo "- shadow-* tokens: $(count '^\s*--ubm-shadow-' $TOKENS)"
echo "- font-* tokens: $(count '^\s*--ubm-font-' $TOKENS)"
echo "- text-* tokens: $(count '^\s*--ubm-text-' $TOKENS)"
echo "- space-* tokens: $(count '^\s*--ubm-space-' $TOKENS)"
echo "- dur-* tokens: $(count '^\s*--ubm-dur-' $TOKENS)"
echo "- ease-* tokens: $(count '^\s*--ubm-ease-' $TOKENS)"

echo "## globals.css @theme bridge coverage"
echo "- bridges (var(--ubm-*)): $(count 'var\(--ubm-' $GLOBALS)"
```

## ローカル実行コマンド

```bash
bash docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-7/collect-coverage.sh \
  > docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-7/coverage-report.md
```

## 完了条件

- [ ] カバレッジ表のすべてのセルが埋まっている
- [ ] **被覆率 100%**（48/48）を達成
- [ ] 不足 token があれば Phase 5 に戻って追加

## 成果物

- `outputs/phase-7/main.md`
- `outputs/phase-7/coverage-report.md`
- `outputs/phase-7/collect-coverage.sh`
