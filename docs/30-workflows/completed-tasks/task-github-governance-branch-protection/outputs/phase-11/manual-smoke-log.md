# Phase 11 — NON_VISUAL マニュアルテスト記録

## 0. NON_VISUAL 宣言（冒頭固定 / 必須）

> **NON_VISUAL 宣言**
> - **タスク種別**: docs-only
> - **非視覚的理由**: 草案仕様化のみ（コード実装・GitHub 適用・GHA 実走を一切行わない）
> - **代替証跡**: 文書整合チェック（リンク存在・命名 canonical・artifacts.json 一致・AC トレーサビリティ）
> - **UI/UX 変更なしのため Phase 11 スクリーンショット不要**

## 1. 証跡の主ソース

| 主ソース | 役割 |
| --- | --- |
| `index.md` | Phase 一覧と outputs パス一覧の宣言 |
| `artifacts.json` | 機械可読な outputs / depends_on / approval flag の正本 |
| `outputs/phase-N/main.md` | 各 Phase のサマリ（Status / 成果物） |
| `outputs/phase-10/go-no-go.md` | AC × 成果物のトレーサビリティ表 |
| `outputs/phase-11/link-checklist.md` | リンク整合チェック結果 |

## 2. スクリーンショット不要理由（固定文言）

- 本タスクは UI 改修を含まない docs-only である
- 画面遷移 / 操作録画の対象が存在しない
- 代替証跡として「文書整合チェック」が機械的に検証可能である
- 結果として **Phase 11 スクリーンショットは不要** とする

## 3. 文書整合チェックの実行記録

2026-04-28 の Phase 12 再検証で、下表を静的チェックとして実施した。

| ID | チェック項目 | 期待 | 結果 | 実施日時 | メモ |
| --- | --- | --- | --- | --- | --- |
| D-1 | `index.md` の Phase 一覧と `artifacts.json` の `phases[]` が件数一致（13） | 一致 | PASS | 2026-04-28 | 13 = 13 |
| D-2 | 各 `phase-NN.md` の「成果物」節が `outputs/phase-N/*.md` と一致 | 一致 | PASS | 2026-04-28 | validate-phase-output PASS |
| D-3 | `outputs/phase-N/main.md` が全 Phase（1〜13）に存在 | 存在 | PASS | 2026-04-28 | find / validator で確認 |
| D-4 | Phase 10 `go-no-go.md` の AC-1〜AC-7 がすべて PASS | PASS | PASS | 2026-04-28 | go-no-go.md に PASS 記録 |
| D-5 | draft 識別子（`branch-protection.main.json.draft` 等）が Phase 2 design.md に存在 | 存在 | PASS | 2026-04-28 | Phase 2 design.md で確認 |
| D-6 | `artifacts.json.cross_task_order` と Phase 1 §6 の依存表が同一順 | 一致 | PASS | 2026-04-28 | self を含む cross_task_order と Phase 1 境界を照合 |
| D-7 | Phase 13 のみ `user_approval_required: true` | true | PASS | 2026-04-28 | Phase 13 のみ true |
| D-8 | CLAUDE.md ブランチ戦略表（dev=1名 / main=2名）と本タスクの reviewer 数が整合 | 一致 | PASS | 2026-04-28 | deployment-branch-strategy.md へ同値同期済み |
| D-9 | 平文トークン / API キーがどの `outputs/**` にも含まれない | 含まれない | PASS | 2026-04-28 | secret 実値なし |
| D-10 | `wrangler` 直接実行を勧める記述がない（`scripts/cf.sh` 経由のみ） | 直接実行記述なし | PASS | 2026-04-28 | `wrangler` 直接実行禁止を PR template に明記 |

## 4. 実地操作不可項目（再掲）

| 項目 | 不可理由 |
| --- | --- |
| branch protection の `gh api` apply | 実装タスクで実施 |
| auto-rebase workflow の実走 | GHA 実環境を要する |
| pull_request_target safety gate dry-run | 実 PR / fork が必要 |
| reviewer 数 2 強制の実観測 | production main へ PR を要する |

## 5. 完了条件

- [x] NON_VISUAL 宣言が冒頭に存在
- [x] 主ソースとスクリーンショット不要理由が明記
- [x] D-1〜D-10 の静的チェック結果が PASS として記録されている
- [x] 実地操作不可項目が列挙されている
