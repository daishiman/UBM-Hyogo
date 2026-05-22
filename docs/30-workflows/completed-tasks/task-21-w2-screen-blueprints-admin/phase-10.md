# Phase 10: 段階的有効化（lint / 視覚値 / API trace）

[実装区分: ドキュメントのみ]
判定根拠: 検証スクリプトの実行と結果記録のみ。コード変更なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 段階的有効化 |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 9（リファクタ） |
| 次 Phase | 11（検証 evidence） |
| 状態 | completed |

## 目的

09g に対して 3 段階のゲート（markdown lint / 視覚値 grep 0 件 / phase-3 §2 と §X.4 完全一致）を順に走らせ、すべて pass することを確認する。
本 Phase では Phase 11 evidence 出力の前段として「最終 09g が AC 全件を満たす」ことを確定する。

## 主要意思決定

- **決定 1**: 段階的有効化は (a) markdown lint → (b) 視覚値 grep → (c) API trace check の順で実行し、(a) を pass するまで (b)(c) は走らせない。
- **決定 2**: markdown lint は `pnpm lint:md` script が存在する場合のみ `mise exec -- pnpm lint:md` を使用し、error 0 を要求。script が無い current workspace では structure / visual / API / a11y gate を代替し、`lint-log.txt` に `NO_LINT_MD_SCRIPT` を記録する。
- **決定 3**: API trace check は phase-3 §2.3 管理層 API table と 09g §X.4 table の `method + endpoint` のみを比較し、`sort -u` 後に行 diff 0 を要求。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 9 | refactor 済 09g | 段階的有効化対象 |
| 下流 | Phase 11 | gate pass 状態 | evidence 出力 |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| C | `outputs/phase-10/main.md` | gate 実行報告 |
| C | `outputs/phase-10/lint-log.txt` | markdown lint 結果 |
| C | `outputs/phase-10/visual-grep-log.txt` | 視覚値 grep 結果 |
| C | `outputs/phase-10/api-trace-diff.txt` | phase-3 ↔ §X.4 diff |

## 実行タスク

- 本 Phase の目的に対応する文書作成・検証・記録を実行する。
- 実行結果は `outputs/phase-N/` 配下へ保存し、root `artifacts.json` の該当 Phase status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- 本 Phase の `outputs/phase-N/main.md` または同等の phase evidence。
- 必要に応じた補助ログ・差分・チェック結果。
- root `artifacts.json` の phase status 更新。

## 入力 / 出力

- 入力: refactor 済 09g、phase-3.md
- 出力: 4 ログファイル

## テスト方針

### 10.1 markdown lint

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
if node -e "process.exit(require('./package.json').scripts?.['lint:md'] ? 0 : 1)"; then
  mise exec -- pnpm lint:md "$F" 2>&1 \
    | tee docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-10/lint-log.txt
else
  echo "NO_LINT_MD_SCRIPT: fallback to structure/visual/API gates" \
    | tee docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-10/lint-log.txt
fi
# 期待: lint:md が存在する場合 error 0 / 不在の場合 NO_LINT_MD_SCRIPT を明記
```

### 10.2 視覚値 grep（AC-5）

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
{
  echo "=== HEX ==="; grep -nE '#[0-9a-fA-F]{3,8}\b' "$F" || echo "0 hits"
  echo "=== oklch ==="; grep -nE 'oklch\(' "$F" || echo "0 hits"
  echo "=== px ==="; grep -nE '\b[0-9]+px\b' "$F" || echo "0 hits"
  echo "=== bg-[ ==="; grep -nE '\bbg-\[' "$F" || echo "0 hits"
} > docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-10/visual-grep-log.txt
# 期待: 4 パターンとも "0 hits"
```

### 10.3 API trace check（AC-6）

```bash
P3=docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
awk '/^### 2\.3 管理層/{flag=1; next} /^### 3\./{if(flag) exit} flag' "$P3" \
  | awk -F'|' '$0 ~ /^\|/ && $4 ~ /(GET|POST|PATCH|DELETE)/ {gsub(/`| /,"",$3); gsub(/ /,"",$4); print $4" "$3}' \
  | sort -u > /tmp/p3-admin.txt
awk '/^### [2-9]\.4 /{flag=1; next} /^### [2-9]\.5 /{flag=0} flag' "$F" \
  | awk -F'|' '$0 ~ /^\|/ && $4 ~ /(GET|POST|PATCH|DELETE)/ {gsub(/`| /,"",$3); gsub(/ /,"",$4); print $4" "$3}' \
  | sort -u > /tmp/09g-admin.txt
diff /tmp/p3-admin.txt /tmp/09g-admin.txt \
  > docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-10/api-trace-diff.txt
# 期待: diff 0 行
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-10
# 上記 10.1 / 10.2 / 10.3 を順に実行
```

## DoD

- [ ] markdown lint error 0、または `NO_LINT_MD_SCRIPT` + structure / visual / API / a11y gate pass
- [ ] 視覚値 grep 4 パターン全て 0 hits
- [ ] API trace diff 0 行
- [ ] 4 ログファイル配置
- [ ] outputs/phase-10/main.md に各 gate 結果サマリ

## 完了条件チェック

- [ ] outputs/phase-10/{main,lint-log,visual-grep-log,api-trace-diff}.* 配置
- [ ] artifacts.json の phase 10 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- Phase 3 check-commands.md / api-trace-spec.md
- task-21 §6.2 / §6.3

## 実行手順

### ステップ 1: markdown lint
`pnpm lint:md` script が存在する場合は実行し error 0 を確認。script が無い場合は `NO_LINT_MD_SCRIPT` を記録し、structure / visual / API / a11y gate を代替 evidence とする。

### ステップ 2: 視覚値 grep
4 パターン（HEX / oklch / px / bg-[）を順に実行し全て 0 件確認。

### ステップ 3: API trace
phase-3 §2 と §X.4 の endpoint を抽出し diff 0 行確認。

### ステップ 4: gate サマリ
3 gate の結果を main.md に表形式でまとめる。

## 次 Phase

- 次: Phase 11（検証 evidence）
- 引き継ぎ: 4 ログファイル / gate サマリ
- ブロック条件: いずれかの gate fail なら Phase 11 不可（Phase 9 へ戻る）。
