# Phase 04: テスト戦略

## サマリ

AC-1〜AC-14 を、grep gate / markdown lint / trace check / structure check の 4 verify suite に対応付ける。詳細マトリクスは `verify-matrix.md` 参照。

## Verify Suite 一覧

| Suite | 目的 | 対応 AC | evidence path |
| --- | --- | --- | --- |
| grep gate | HEX/oklch/px/`bg-[`/`text-[` 0 件確認 | AC-3 / AC-4 / AC-5 / AC-6 | `outputs/phase-11/evidence/grep-gate.log` |
| structure check | H2 = 10 / `### 2.` = 20 / `### 3.1.` = 13 件 | AC-1 / AC-2 / AC-7 / AC-8 | `outputs/phase-11/evidence/structure-check.log` |
| markdown lint | markdown 構文整合 | AC-14 | `outputs/phase-11/evidence/markdown-lint.log` |
| trace check | 19 routes + global-error fallback / primitives 13 / login 5 状態 / dialog aria-modal / token prefix 8 種 / apps/web→D1 0 件 / gas-prototype 不採用 4 行 | AC-7 / AC-8 / AC-9 / AC-10 / AC-11 / AC-12 / AC-13 | `outputs/phase-11/evidence/trace-check.log` |

## 実行コマンド（再現）

```bash
# grep gate
grep -nE '#[0-9a-fA-F]{3,8}\b' docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE 'oklch\(' docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE '\b[0-9]+px\b' docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE 'bg-\[#|text-\[#' docs/00-getting-started-manual/specs/09-ui-ux.md
# 全て exit 1 (= 0 件) を期待

# structure check
grep -c '^## ' docs/00-getting-started-manual/specs/09-ui-ux.md   # 10
grep -c '^### 2\.' docs/00-getting-started-manual/specs/09-ui-ux.md  # 20
grep -c '^#### 3\.1\.' docs/00-getting-started-manual/specs/09-ui-ux.md  # 13

# markdown lint
markdownlint docs/00-getting-started-manual/specs/09-ui-ux.md

# trace check
grep -nE '^### 2\.' docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE '^### 5\.2' docs/00-getting-started-manual/specs/09-ui-ux.md
grep -nE '^### 4\.2' docs/00-getting-started-manual/specs/09-ui-ux.md
```

## Phase 11 evidence へのリンク

実行結果の証跡は Phase 11（NON_VISUAL 縮約）にて取得済み:

- `outputs/phase-11/evidence/grep-gate.log`（HEX/oklch/px/`bg-[` すべて 0 件）
- `outputs/phase-11/evidence/structure-check.log`（H2=10 / `### 2.`=20 / `### 3.1.`=13）
- `outputs/phase-11/evidence/markdown-lint.log`（exit 0）
- `outputs/phase-11/evidence/trace-check.log`（routes / primitives / a11y / token / 不採用 一致）

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | AC × verify suite 対応表 | completed |
| 2 | grep gate コマンド集 | completed |
| 3 | structure check コマンド集 | completed |
| 4 | trace check コマンド集 | completed |
| 5 | verify-matrix.md 配置 | completed |

## 次 Phase

Phase 5（実装ランブック）へ。書き換え手順とロールバック手順を確定する。
