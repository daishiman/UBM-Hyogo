# issue-1125 / bulk tag UI result 2 状態の認証付き staging mutation visual baseline

> **実装区分: 実装仕様書** — コード変更（新規 Playwright spec 1 ファイル + 専用 seed/cleanup SQL 2 ファイル + capture オーケストレーション shell 1 ファイル）を伴う。
> 判定根拠: 目的（staging 認証付き実機 `/admin/members` で実 `POST /admin/members/tags/bulk` mutation を実行し、その result summary 2 状態 [all-success / partial-failure] の visual baseline を取得）は、現行コードでは `page.setContent()` の local fixture（親 issue-1036）でしか証明できておらず、実機到達には新規テストコード + 専用 staging fixture の追加が必須。docs / 調査のみでは達成不可能なため実装仕様書とする（CONST_004）。

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1125-bulk-tag-result-staging-mutation-visual-baseline` |
| task_id | `TASK-ISSUE-1125-BULK-TAG-RESULT-STAGING-MUTATION-VISUAL-001` |
| GitHub issue | [#1125](https://github.com/daishiman/UBM-Hyogo/issues/1125)（**CLOSED 維持**） |
| status | `implemented_local_evidence_captured` / implementation / `VISUAL_ON_EXECUTION` / `staging_runtime_pending_user_gate` |
| implementation_mode | `new`（成果物 spec / seed / cleanup / runner は新規追加。機能本体は landed 済み） |
| 親 workflow | `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` |
| 部分消化元 workflow | `docs/30-workflows/completed-tasks/issue-1077-bulk-tag-authenticated-staging-visual/` |
| 消費する未タスク | `docs/30-workflows/unassigned-task/task-issue-1036-followup-001-staging-authenticated-bulk-tag-visual-baseline.md`（残スコープ追跡 Issue #1125） |
| 規模 | 小規模（新規 spec 1 + seed/cleanup SQL 2 + runner shell 1） |
| 作成日 | 2026-06-06 |

---

## 0. 調査結論（なぜこの仕様書を作るか）

### 0.1 「既に他タスクで解決済みか」の調査結果 → **未解決（B）**

issue #1125（= `task-issue-1036-followup-001` の残スコープ）の「result 2 状態の認証付き staging mutation visual baseline」は、コードベース全体を調査した結果 **未実装** である。

| 関連タスク | 射程 | result 2 状態の staging mutation baseline |
| --- | --- | --- |
| issue-1036（親） | local fixture で 4 baseline 取得 | ❌ `page.setContent()` local fixture のみ（`apps/web/playwright/tests/issue1036-bulk-member-tags.spec.ts:136-146`） |
| issue-1077（部分消化） | picker 2 状態を read-only authenticated staging spec 化 | ❌ result 2 状態は **明示的にスコープ外**（`issue-1077/index.md:34-37`、`admin-members-bulk-tag-authenticated.spec.ts:75` で `bulk-tag-result` count 0 を assert） |
| issue-1081 / #1144 | bulk tag endpoint real D1 runtime smoke | ❌ `visualEvidence: NON_VISUAL`（API contract 検証のみ・UI screenshot なし） |
| issue-1080 | result summary の member/tag label 表示改善 | ❌ local component test のみ |

→ 既存の `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/outputs/phase-11/screenshots/bulk-tag-result-{all-success,partial-failure}.png` は **すべて local fixture（`page.setContent()`）** であり、staging の Auth.js session / Workers runtime / 実 D1 mutation 後の result summary を証明していない。**Issue #1125 は実行が必要。**

### 0.2 「issue が古いか」の調査結果 → **現行コードへ最適化が必要**

issue #1125 作成時（2026-06-03）以降、次の基盤が landed した:

1. **認証付き staging Playwright 基盤**（issue-901 / issue-1077 系）: `setup.staging-auth.ts` が admin storageState を mint、`staging-visual-authenticated` project が `testDir: ./playwright/tests/visual-staging-authenticated` で自動登録。
2. **staging D1 seed/cleanup + redact 基盤**（issue-1081 / #1144）: `scripts/smoke/runtime-tag-bulk.sh` が `cf.sh d1 execute --remote` で synthetic prefix fixture を seed/cleanup し、`trap ... EXIT` で確実に後始末、`redact.sh` でログを秘匿化。

→ **根本最適化**: issue body が前提とする「手動 user-gated screenshot 取得」をやめ、**(a) 認証付き staging Playwright spec（mutation interaction-gated）+ (b) 専用 staging fixture の seed/cleanup を `trap` 付き shell runner でオーケストレーション** する恒久解にする。これにより result 2 状態の baseline 取得が CI 化可能な再現フローになり、共有 staging D1 への副作用は synthetic prefix `e2e_test_issue1125_` に限定 + 必ず cleanup される。

### 0.3 partial-failure 再現方法の真の論点（Phase 2 で確定）

result summary の partial-failure は 2 要因で発生する:

| 要因 | result DOM | UI 操作だけで再現可能か |
| --- | --- | --- |
| 退会済み member（`member_status.is_deleted=1`）への付与 → `skipped` | `bulk-tag-result-skipped` | ✅ 可能（退会済み member を seed し、active member と混在選択して登録済み tag を適用） |
| 未登録 tag（`tag_definitions` に無い tagId）→ `notFound` | `bulk-tag-result-not-found` | ❌ 不可（tag picker は登録済み tag しか描画しない） |

→ **本タスクの partial-failure baseline は「退会済み member による `skipped` を含む result summary」を主シナリオとする**（UI 操作で確実かつ実 mutation で再現可能）。`notFound`（未登録 tag）の視覚網羅は親 local fixture + `BulkActionBar.spec.tsx` TC-BAB-TAG-03 が継続担保する（issue-1077 と同じ論法）。この判断根拠と代替担保は Phase 1-2 / unassigned-task-detection に明記する。

---

## 1. 受け入れ基準（現行コードへ最適化済み）

| ID | 受け入れ基準 |
| --- | --- |
| AC-1 | 専用 staging fixture（`e2e_test_issue1125_` prefix）を seed すると、all-success 用 active member 2 名 + 登録済み tag 2 件、partial-failure 用 active member 1 名 + 退会済み member 1 名 + 登録済み tag 1 件が staging D1 に投入される |
| AC-2 | 認証付き staging `/admin/members` で all-success 用 member を選択し tag を選んで apply すると、`bulk-tag-result`（`bulk-tag-result-counts` で付与>0 / skipped=0 / notFound=0）が表示され `bulk-tag-result-all-success.png` baseline を取得する |
| AC-3 | partial-failure 用 member（active + 退会済み混在）を選択し tag を適用すると、`bulk-tag-result-skipped` が表示され（退会済みスキップ≥1）`bulk-tag-result-partial-failure.png` baseline を取得する |
| AC-4 | baseline canonical 名が phase-11 / implementation-guide / artifacts ledger（`canonical_screenshots`）と一致する（staging snapshot 名前空間 `{arg}-authenticated-staging-visual-{platform}` で local fixture と衝突しない） |
| AC-5 | mutation 対象は `e2e_test_issue1125_` synthetic prefix のみ。capture 完了後（成功/失敗/中断いずれも `trap ... EXIT`）に cleanup を実行し、`member_tags` / `audit_log` / `member_status` / `member_identities` / `member_responses` / `tag_definitions` の synthetic 残存件数が 0 であることを検証・記録する |
| AC-6 | 実行ログに admin storageState 経路・対象 URL・capture command・保存先・mutation 対象 ID・seed/cleanup 結果を残す（`redact.sh` で秘匿化） |
| AC-7 | staging guard を満たす（`CF_D1_DATABASE=ubm-hyogo-db-staging` 固定 / production target 拒否 / staging allowlist 一致）。production 環境では一切実行しない |
| AC-8 | apps/api・apps/web の **アプリ本体ソース**・D1 schema（`migrations/*.sql` の table 定義）・Google Form 仕様を変更しない（新規テストコード + 新規 seed/cleanup SQL + 新規 runner shell の追加のみ。`migrations/seed/` は schema 変更ではなく synthetic データ投入） |

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
| 11 手動テスト | [outputs/phase-11/manual-test-result.md](outputs/phase-11/manual-test-result.md) | local_evidence_present / staging_runtime_pending |
| 12 ドキュメント同期 | [outputs/phase-12/main.md](outputs/phase-12/main.md) | completed |
| 13 commit-pr-release | [outputs/phase-13/pr-creation-result.md](outputs/phase-13/pr-creation-result.md) | pending_user_approval |

---

## 3. runtime 境界（user-gated）

本 wave では Phase 1-13 の実装仕様書に加え、仕様で定義した新規 Playwright spec / seed SQL / cleanup SQL / runner shell / runner shell test を実コードとして追加した。以下の外部副作用とリポジトリ公開操作のみ user 承認後に実施する:

- 認証付き staging への seed → mutation 実行 → baseline snapshot 生成/commit → cleanup
- staging deploy / push / PR 作成

GitHub issue #1125 は **CLOSED のまま**とし reopen しない（recovered_from_unassigned / refs_only）。commit / push / PR はユーザー指示があるまで実行しない。

---

## 4. スコープ収束（CONST_007）

本タスクは **後続の実装プロンプト（03.実装.md）の 1 サイクル内で完了できるスコープ**に収める:

- 新規ファイル: Playwright spec 1 + seed SQL 1 + cleanup SQL 1 + runner shell 1（+ runner の bats 風 shell test 1 を Phase 6 で追加）。
- 先送り（将来タスク / 別 PR）に切り出す項目は **無い**。`notFound`（未登録 tag）の視覚網羅は **先送りではなく**、親 local fixture + component spec で既に担保済みのため本タスクのスコープに含めない（代替担保が存在する scope-out であり、未完了の先送りではない）。
