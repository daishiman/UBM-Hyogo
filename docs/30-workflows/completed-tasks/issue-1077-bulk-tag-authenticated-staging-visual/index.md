# issue-1077 / bulk tag UI authenticated staging picker visual baseline

> **実装区分: 実装仕様書** — コード変更（新規 Playwright spec 1 ファイル）を伴う。
> 判定根拠: 目的（staging 認証付き実機 `/admin/members` で BulkActionBar tag picker の visual baseline を取得）は、現行コードでは `page.setContent()` の local fixture でしか証明できておらず、実機到達には新規テストコードの追加が必須。docs / 調査のみでは達成不可能なため実装仕様書とする（CONST_004）。

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1077-bulk-tag-authenticated-staging-visual` |
| task_id | `TASK-ISSUE-1077-BULK-TAG-AUTHENTICATED-STAGING-VISUAL-001` |
| GitHub issue | [#1077](https://github.com/daishiman/UBM-Hyogo/issues/1077)（**CLOSED 維持**） |
| status | `implemented_local_runtime_pending` / implementation / `VISUAL_ON_EXECUTION` |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 規模 | 小規模（新規 spec 1 ファイル / config 編集不要） |
| 作成日 | 2026-06-03 |

---

## 0. 調査結論（なぜこの仕様書を作るか）

issue #1077（= `task-issue-1036-followup-001`）の「staging 認証付き visual baseline 取得」は、

1. **機能本体は完全実装済み・dev に landed**（`BulkActionBar.tsx` / `POST /admin/members/tags/bulk` / `GET /admin/tags` / component spec TC-BAB-TAG-01..05 / contract spec B-T1..10、commit `ca3fb9336` PR #1085）。
2. **しかし staging 認証付き visual baseline は他タスクで未解決**（completed-tasks に該当なし、現行 `issue1036-bulk-member-tags.spec.ts` は今も `page.setContent()` local fixture）。
3. **issue は「古い」**: 作成時（2026-06-01）は「手動 user-gated screenshot 取得」前提だったが、その後 **認証付き staging Playwright 基盤が landed**（`mint-staging-storage-state.ts` / `staging-visual-authenticated` project / `playwright-staging-visual-authenticated.yml`）。

→ **根本最適化**: 手動取得ではなく、既存 authenticated 基盤を使って `/admin/members` 実機で member 選択 → tag picker を開く **interaction-gated authenticated staging Playwright spec をコード化**する。これが現行コードに即した恒久解である。

### スコープ判断（ユーザー承認済み 2026-06-03）

| 状態 | 取得方法 | 本タスクのスコープ |
| --- | --- | --- |
| `bulk-tag-picker-assign-mode` | 認証付き staging で member 選択 + tag picker 表示（**read-only**） | ✅ 含む |
| `bulk-tag-picker-unassign-mode` | 認証付き staging で付与/解除トグル（**read-only**） | ✅ 含む |
| `bulk-tag-result-all-success` | 実 `POST .../tags/bulk` mutation が必須（staging D1 副作用） | ❌ スコープ外（下記） |
| `bulk-tag-result-partial-failure` | 退会済み member + 未登録 tag のデータ投入 + mutation 必須 | ❌ スコープ外（下記） |

**result 2 状態をスコープ外にする理由（CONST_005 例外）**: 実機での all-success / partial-failure 取得は staging 共有 D1 への副作用を伴う mutation 実行が不可避であり、今回サイクル内で完了させると「共有 staging データへの破壊的副作用」という整合性破綻を招く。result summary の描画は API レスポンス shape から純粋に決まり、既に `BulkActionBar.spec.tsx` TC-BAB-TAG-03（component spec）と親 local fixture baseline で担保済み。実施時期・場所は [outputs/phase-12/unassigned-task-detection.md](outputs/phase-12/unassigned-task-detection.md) に未タスクとして記録する。

---

## 1. 受け入れ基準（現行コードへ最適化済み）

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 認証付き staging `/admin/members` で複数 member を選択すると `BulkActionBar`（`aria-label="一括操作"`）と tag picker（`aria-label="タグ一括付与・解除"`）が表示される |
| AC-2 | assign モードで `bulk-tag-picker-assign-mode.png` baseline を取得する（`toHaveScreenshot`、bulk region locator scoped） |
| AC-3 | 付与/解除トグル（`aria-label="付与モード"`）を解除へ切り替えて `bulk-tag-picker-unassign-mode.png` baseline を取得する |
| AC-4 | baseline canonical 名が phase-11 / implementation-guide / artifacts ledger（`canonical_screenshots`）と一致する |
| AC-5 | 実行ログに admin storageState 経路・対象 URL・capture command・保存先を残す |
| AC-6 | **mutation を一切実行しない**（apply ボタンを押さない / staging D1 へ副作用ゼロ） |
| AC-7 | apps/api・apps/web ソース・D1 schema・Google Form 仕様を変更しない（テストコード追加のみ） |

---

## 2. Phase 一覧

| Phase | 出力 | 状態 |
| --- | --- | --- |
| 1 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) | completed (spec) |
| 2 設計 | [phase-2-design.md](phase-2-design.md) | completed (spec) |
| 3 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) | completed (spec) |
| 4 テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) | completed (spec) |
| 5 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) | completed (spec) |
| 6 テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) | completed (spec) |
| 7 カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) | completed (spec) |
| 8 リファクタ | [phase-8-refactor.md](phase-8-refactor.md) | completed (spec) |
| 9 QA | [phase-9-qa.md](phase-9-qa.md) | completed (spec) |
| 10 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) | completed (spec) |
| 11 手動テスト | [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) | runtime_pending |
| 12 ドキュメント同期 | [outputs/phase-12/main.md](outputs/phase-12/main.md) | completed |
| 13 commit-pr-release | [outputs/phase-13/pr-creation-result.md](outputs/phase-13/pr-creation-result.md) | pending_user_approval |

---

## 3. runtime 境界（user-gated）

本 wave で新規 Playwright spec と focused 回帰 Vitest は完了済み。以下は user 承認後に実施する:

- 認証付き staging Playwright 実行 + baseline snapshot 生成/commit
- staging deploy / push / PR 作成

GitHub issue #1077 は **CLOSED のまま**とし reopen しない。
