# Phase 11: マニュアルテスト / Evidence

## NON_VISUAL 宣言

> **visualEvidence: `NON_VISUAL`**

| 宣言項目 | 内容 |
|----------|------|
| タスク種別 | docs-only（workflow tracking JSON メタデータ / markdown checkbox の status 整合補正のみ）|
| 非視覚的である理由 | UI / レンダリング変更が一切ない。`apps/` 配下のコンポーネント・スタイル・ルーティングに触れず、補正対象は `docs/30-workflows/completed-tasks/members-list-ux-clarity/` 配下の `artifacts.json` status フィールドと `phase-10-final-review.md` の checkbox のみ |
| 代替証跡 | スクリーンショットの代わりに、機械可読な自動検証コマンド（`jq` / `diff` / `gate-metadata:validate` / `rg`）の実行結果を証跡とする |
| スクリーンショットを作らない理由 | 画面表示の差分が存在しないため。視覚的 evidence を捏造すると Feedback 4（VISUAL 証跡の不正流用）/ WEEKGRD-03（NON_VISUAL タスクへの不要スクショ添付）に抵触する。よって意図的にスクリーンショットを作成しない |

> 本タスクは **実地操作（ブラウザでの手動 UI 操作）が不可能** である。検証対象が
> 機械可読メタデータの整合性であり、人手の画面操作で確認すべき挙動が存在しないため。
> 代わりに以下の自動検証を主証跡とする。

## 証跡の主ソース（検証コマンド）

| # | 検証コマンド | 確認内容 | AC 対応 |
|---|--------------|----------|---------|
| 1 | `jq -r '.status, .metadata.workflow_state, .metadata.implementation_status' <root>/artifacts.json` | root 3 値が `implemented_local_runtime_pending` | AC-1 |
| 2 | `jq '[.phases[] \| select(.phase<=12) \| .status] \| unique' <root>/artifacts.json` | Phase 1-12 = `["completed"]` | AC-2 |
| 3 | `jq '.phases[] \| select(.phase==13) \| .status' <root>/artifacts.json` | Phase 13 = `"pending"`（user-gated 維持）| AC-2 |
| 4 | `diff -u <root>/artifacts.json <root>/outputs/artifacts.json` | parity（差分なし / exit 0）| AC-3 |
| 5 | `jq '.metadata.workflow_state' <task-a\|b\|c>/artifacts.json` | A/B/C 全て `implemented_local_runtime_pending` | AC-4 |
| 6 | `rg -n '^\- \[ \]' <task-b>/phase-10-final-review.md` | AC checkbox 未チェック 0 | AC-5 |
| 7 | `jq '.metadata.gates' <root>/artifacts.json` | Gate-A/B = `passed`（evidence path 実在）、Gate-C = `pending` | AC-6 |
| 8 | `rg 'members-list-ux-clarity' .claude/skills/aiworkflow-requirements` | register / inventory が `implemented_local_runtime_pending` と一致 | AC-7 |
| 9 | `mise exec -- pnpm gate-metadata:validate` | members-list-ux-clarity artifacts に対し ERROR 0 | AC-8 |

> 主ソースは **#9 `gate-metadata:validate`**（補正後 artifacts の zod schema / gate enum / evidence_path 実在を一括検証）。
> #1-#8 は AC 単位の局所 assert として補助証跡に位置づける。

## Local Evidence（補正後に取得）

| # | 内容 | 結果（補正後に記録）|
|---|------|---------------------|
| 1 | コマンド #1-#9 の連続実行結果 | 補正後に取得 |
| 2 | `git status --porcelain apps/ packages/` が空（apps/ / packages/ 無変更の保証）| 補正後に取得（期待: 空）|
| 3 | 補正前 RED 確認（補正前は #1 が `spec_created` を返すこと）| 補正前に取得（TDD RED 相当）|

## Evidence 配置先

- `outputs/phase-11/manual-test-result.md`: 上記コマンド #1-#9 の実行ログと AC 判定の記録。
- スクリーンショット（PNG）は **作成しない**（NON_VISUAL 宣言に基づく）。

## 取得手順（補正後・read-only）

1. 補正前に #1 を実行し `spec_created` を確認（RED 相当の事前 fail 記録）。
2. 本実行サイクルが 6 ファイルを補正。
3. #1-#9 を順に実行し、各 AC が期待値を満たすことを確認。
4. `git status --porcelain apps/ packages/` が空であることを確認し、docs-only であることを保証。
5. 結果を `outputs/phase-11/manual-test-result.md` へ記録する。
