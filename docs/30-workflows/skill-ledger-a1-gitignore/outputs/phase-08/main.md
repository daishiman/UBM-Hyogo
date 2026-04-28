# Phase 8 成果物: リファクタ対象テーブル

## 実行ステータス

> **NOT EXECUTED — docs-only / spec_created**
> 本ワークフローは仕様書整備に閉じる。実リファクタは Phase 5 実装 PR の完了直後に走らせる前提で、本ファイルは「対象 / Before / After / 理由」のテンプレ表のみを保持する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 作成日 | 2026-04-28 |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |
| 状態 | spec_created |

## A. hook ガード（冪等性整理）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| A1 | post-commit ガード | skill ごとに `[ -f indexes/keywords.json ] && exit 0` をインライン重複 | `.lefthook/lib/skip-if-tracked.sh <path>` 呼び出しに集約 | DRY / canonical 不書込み境界の単一情報源化 |
| A2 | post-merge ガード | post-commit と同等のガードがコピー&ペースト | 同ヘルパー呼び出しで統一 | 修正点を 1 箇所に局所化 |
| A3 | 存在チェック表記 | `test -f` と `[ -e ]` 混在 | `[ -f path ]` に統一 | 表記揺れ解消 |
| A4 | tracked 判定 | hook 内に `git ls-files --error-unmatch` 直書き重複 | ヘルパー内 1 箇所に集約 | 単一情報源 |
| A5 | log prefix | hook ごとに `[skill]` `[ledger]` 等の表記揺れ | `[skill-ledger]` に統一 | grep 検索性 |
| A6 | exit code 規約 | 暗黙 | 「skip = 0 / 再生成成功 = 0 / 失敗 = 1」をコメント化 | 規約の明文化 |

> 実装は T-6（task-skill-ledger-hooks）に委ねる。本 Phase では仕様確定のみ。

## B. `.gitignore` セクション整列

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| B1 | section header | A-1 glob を `.gitignore` 末尾に追記、既存ブロックと未分離 | `# === skill auto-generated (do not commit) ===` 専用ブロック | 可読性 / レビュー追跡性 |
| B2 | glob 列挙順序 | 任意順 | runbook §Step 1 順 (`indexes/keywords.json` → `indexes/index-meta.json` → `indexes/*.cache.json` → `LOGS.rendered.md`) | 順序ドリフト 0 |
| B3 | 末尾 newline | 表記揺れ | 末尾 newline 1 つで終端 | POSIX text file 規約 |
| B4 | 由来コメント | A-1 由来である旨が未記載 | `# managed by docs/30-workflows/skill-ledger-a1-gitignore/phase-05.md` | 由来追跡 |
| B5 | section 末尾区切り | なし | `# === end skill auto-generated ===` で終端 | 後続 section との境界明確化 |

## C. 用語・命名統一

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| C1 | derived artifact 呼称 | 「派生物」「自動生成」「auto-generated」混在 | 「派生物 (derived artifact / skill auto-generated)」併記で統一 | 用語ドリフト 0 |
| C2 | canonical 呼称 | 「正本」「canonical」混在 | 「正本 (canonical)」併記 | Phase 1〜3 と整合 |
| C3 | hook ガード呼称 | 「冪等」「idempotent」混在 | 「冪等ガード (idempotent guard)」併記 | 全 Phase 統一 |

## D. 重複コード抽出箇所

| # | 重複候補 | 抽出先（提案） | 他 hook 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| D1 | tracked 判定 | `.lefthook/lib/skip-if-tracked.sh` | 可（A-1 / B-1 / T-6） | 引数: `<path>` |
| D2 | 存在チェック | 同ヘルパー内関数 | 可 | 同上 |
| D3 | log prefix | 共通 echo helper | 限定的 | hook 群でのみ |
| D4 | exit code 規約 | コメント規約化 | 可 | hook 全般 |

## E. navigation drift 確認結果（spec_created 段階）

| # | チェック項目 | 結果 |
| --- | --- | --- |
| E1 | artifacts.json `phases[*].outputs` × 実 path | Phase 10 は `outputs/phase-10/main.md` に統一。Phase 9 link 検証で再確認 |
| E2 | index.md `Phase 一覧` 表 × 実 phase-NN.md ファイル名 | 一致 |
| E3 | phase-NN.md 内の相対参照 | 既存 Phase 1〜3 はリンク切れ 0、Phase 8〜10 は本 Phase で新設のため Phase 9 で再検証 |
| E4 | 用語ドリフト | 用語統一 C1〜C3 適用後 0 を期待 |

## F. 削除対象

| # | 対象 | 理由 |
| --- | --- | --- |
| F1 | 旧 `.git/hooks/*` 手書き hook 残骸 | lefthook 正本化以降 |
| F2 | runbook 例示由来の特定 skill パスべた書き | 全 skill 横断棚卸しに置換 |
| F3 | 重複 `# auto-generated` コメント | 用語統一後の冗長コメント |

## G. 実行履歴

| 試行 | 日時 | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 2026-04-28 | spec_created | 仕様書 / プレースホルダ作成のみ。実リファクタは Phase 5 実装後に実施 |

## H. 次 Phase への申し送り

- Phase 9: line budget / link 整合 / mirror parity 検証で本表の navigation drift（E1）を最終確認。
- Phase 10: blocker 判定基準に「hook が canonical を書く設計が残っていない」（B-04）を組み込み済み。
- Phase 12: ヘルパー仕様 `.lefthook/lib/skip-if-tracked.sh` を T-6 に正式引き渡し。
