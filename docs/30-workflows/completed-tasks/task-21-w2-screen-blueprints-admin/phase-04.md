# Phase 4: TDD RED

[実装区分: ドキュメントのみ]
判定根拠: 09g 未作成状態で Phase 3 検証スクリプトを実行し fail を観測するのみ。コード変更なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 4 / 13 |
| Phase 名称 | TDD RED |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 3（テスト戦略） |
| 次 Phase | 5（TDD GREEN） |
| 状態 | completed |

## 目的

`09g-screen-blueprints-admin.md` がまだ存在しない状態で Phase 3 の全検証スクリプトを実行し、構造検証 / 視覚値 grep / API trace check が **期待通り fail する** ことを記録する。
これにより、Phase 5〜8 で逐次セクションを書き進めるたびに、どの検証が pass に転じるかをトレース可能にする。

## 主要意思決定

- **決定 1**: RED 観測は「ファイル不在 → 全検証 fail」と「ファイルあり / 内容不完全 → 構造検証 fail」の 2 段階で行う。
- **決定 2**: RED log を `outputs/phase-04/red-log.txt` に保存し、Phase 5 GREEN との before/after 対比に用いる。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 3 | check-commands.md | RED 実行コマンド |
| 下流 | Phase 5 | RED log | GREEN 開始時の baseline |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| C | `outputs/phase-04/main.md` | RED Phase 主成果物 |
| C | `outputs/phase-04/red-log.txt` | 検証スクリプト出力 |

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

- 入力: Phase 3 check-commands.md
- 出力: `outputs/phase-04/main.md`, `red-log.txt`

## テスト方針

### 4.1 ファイル不在 RED

```bash
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
[ -f "$F" ] && echo "FAIL: file already exists" || echo "RED: file absent (expected)"
```

### 4.2 構造検証 RED（ファイル不在 → grep が 0 を返す）

```bash
# wc / grep を実行し、いずれも RED 結果（期待値未達）を red-log.txt に追記
{
  echo "=== existence check ==="
  ls -la "$F" 2>&1 || true
  echo "=== section count (expect 10) ==="
  grep -cE '^## [0-9]+\. ' "$F" 2>/dev/null || echo 0
  echo "=== sidebar count (expect 1) ==="
  grep -c '^## 1\. AdminSidebar' "$F" 2>/dev/null || echo 0
  echo "=== mermaid count (expect >= 8) ==="
  grep -c '^```mermaid$' "$F" 2>/dev/null || echo 0
} > docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-04/red-log.txt
```

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-04
F=docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md
# Phase 3 check-commands.md のスクリプトを実行（fail を期待）
bash docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-03/check-commands.md \
  > docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-04/red-log.txt 2>&1 || true
```

## DoD

- [ ] 09g 未作成状態を確認
- [ ] red-log.txt に各検証の 0 件 / file not found 出力が記録
- [ ] outputs/phase-04/main.md に RED 結果サマリ記述
- [ ] Phase 5 GREEN への引き継ぎ（どの検証が最初に pass するかの予測）

## 完了条件チェック

- [ ] outputs/phase-04/main.md / red-log.txt 配置
- [ ] artifacts.json の phase 4 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- Phase 3 outputs（check-commands.md）

## 実行手順

### ステップ 1: 09g ファイル不在を確認
`ls` で存在しないことを確認し、red-log.txt 冒頭に記録。

### ステップ 2: 全検証スクリプト実行
構造検証 / 視覚値 grep / API trace check を順に実行し、red-log.txt に追記。

### ステップ 3: RED 結果サマリ
section_count = 0 / sidebar_count = 0 / mermaid_count = 0 / api_trace = file_not_found を main.md に記述。

### ステップ 4: Phase 5 への引き継ぎ
GREEN 開始時に最初に pass する検証は「§1 AdminSidebar 1 箇所」と予測される旨を記述。

## 次 Phase

- 次: Phase 5（TDD GREEN）
- 引き継ぎ: red-log.txt / RED 結果サマリ
- ブロック条件: red-log.txt が空の場合は Phase 5 不可（RED 未確認）。
